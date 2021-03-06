import React from 'react';
import moment from 'moment';
import LocalizedStrings from 'react-localization';

let strings = new LocalizedStrings({
    en: {
        title: 'Weather',
        now: 'Now',
        next: 'in',
        noPrecipitation: 'No precipitation expected.',
        Rain: 'Rain',
        Snow: 'Snow',
        Thunderstorm: 'Thunderstorm',
        Drizzle: 'Drizzle'
    },
    fr: {
        title: 'Meteo',
        now: 'Actuellement',
        next: 'dans',
        noPrecipitation: 'Aucune précipitation prévue.',
        Rain: 'Pluie',
        Snow: 'Neige',
        Thunderstorm: 'Orage',
        Drizzle: 'Bruine'
    }
});

import Card from './card';

const MINUTE = 60000;
const PRECIPITATION_TYPES = new Set(['Rain', 'Snow', 'Thunderstorm', 'Drizzle']);

export default class ForecastWeatherCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            lang: props.lang
        };

        strings.setLanguage(props.lang);        
        
    }

    componentDidMount() {
        this.updateWeatherData('en');
        setInterval(this.updateWeatherData.bind(this), 60 * MINUTE);
    }

    componentWillReceiveProps(nextProps) {
        strings.setLanguage(nextProps.lang);
        this.updateWeatherData(nextProps.lang);
        this.setState({});
    }

    updateWeatherData(lang) {
        var currentWeatherResponse;
        fetch('http://api.openweathermap.org/data/2.5/weather?id=6077243&APPID=dc252e41ccdd53d0' +
                    '6d044cde8f15dedb&units=metric&lang=' + lang)
            .then(response => response.json())
            .then(jsonResponse => {
                currentWeatherResponse = jsonResponse;
            })
            .then(() => {
                return fetch(
                    'http://api.openweathermap.org/data/2.5/forecast?id=6077243&units=metric' +
                    '&lang=' + lang +
                    '&appid=dc' +
                    '252e41ccdd53d06d044cde8f15dedb');
            })
            .then(response => response.json())
            .then(jsonResponse => {
                this.setState({currentWeather: currentWeatherResponse, forecastWeather: jsonResponse});
            });
    }

    renderCurrentCondition(currentWeather) {
        let currentCondition = currentWeather.main.temp;
        currentCondition = Math.round(currentCondition) + '\u00B0';
        return <span>
            {strings.now}: {currentCondition}.
        </span>;
    }

    renderPrecipitationDisplay(precipitations, currentCondition) {
        let precipitationDisplay;
        const isCurrentPrecipitation = PRECIPITATION_TYPES.has(currentCondition);

        if (precipitations.length) {
            var idx=0;
            precipitationDisplay = precipitations.map(precipitation => {
                idx++;
                var precipitationToTranslate = precipitation.weather[0].main;
                if (strings[precipitationToTranslate]) {
                    return <span key={idx}>{strings[precipitationToTranslate]} {strings.next}&nbsp;
                        {moment(precipitation.dt_txt)
                            .locale(this.props.lang)
                            .fromNow(true)}.
                    </span>;
                } else {
                    return <span></span>;
                }
            });
        } else if (!isCurrentPrecipitation) {
            precipitationDisplay = <span>
                {strings.noPrecipitation}</span>;
        }

        return precipitationDisplay;
    }

    render() {
        if (!this.state.currentWeather) {
            return null;
        }

        const currentConditionDisplay = this.renderCurrentCondition(this.state.currentWeather);
        const currentCondition = this.state.currentWeather.main.temp;
        const precipitations = findPrecipitations(currentCondition, this.state.forecastWeather.list);
        const precipitationDisplay = this.renderPrecipitationDisplay(precipitations, currentCondition);

        return <Card size="1.5">
            <span className="WeatherCard-title">{strings.title}</span>&nbsp;
            <span>{currentConditionDisplay}&nbsp;{precipitationDisplay}</span>
        </Card>;
    }
}

function findPrecipitations(currentCondition, weatherPoints) {
    const seenPrecipitations = new Set();
    var result = [];
    weatherPoints.forEach(weatherPoint => {
        const condition = weatherPoint.weather[0].main;
        if (currentCondition !== condition && PRECIPITATION_TYPES.has(condition) && !seenPrecipitations.has(condition)) {
            seenPrecipitations.add(condition);
            result.push(weatherPoint);
        }
    });
    return result;
}
