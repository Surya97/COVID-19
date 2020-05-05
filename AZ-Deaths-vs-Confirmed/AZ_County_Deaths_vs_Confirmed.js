var initialData;
var dates;
var groupedData;
var chartData;
var xticks = [];
var yticks = [];
var frames = [];
var sliderSteps = [];
var config = {responsive: true};

var xmax = 0;
var ymax = 0;

var traces;

function initData() {
    Plotly.d3.csv("Arizona_county_historic_data.csv", function(err, data){
        initialData = data;
        processData();
    });
}

function processData(data){
    var processedData = [];
    initialData.forEach(e => {
        e['date_new'] = formatDate(e['Date']);
        if(checkStartDate(e['date_new'])){
            processedData.push(e);
        }
        dates = [... new Set(processedData.map(e => e['Date']))];
        xmax = Math.max(xmax, parseFloat(e['Confirmed']));
        ymax = Math.max(ymax, parseFloat(e['Deaths']));
    });
    for(let x_range = 1; x_range <= xmax; x_range++){
        xticks.push(x_range);
    }
    for(let y_range = 1; y_range <= ymax; y_range++){
        yticks.push(y_range);
    }
    createTraces();
    createFrames();
    createSliderSteps();

    function formatDate(date){
        if(date){
            let [y, m, d] = date.split("-");
            return new Date(2020, m-1, d).toISOString().slice(0, 10);
        }
    }

    function checkStartDate(date){
        let start_date = new Date(2020, "02", "01").toISOString().slice(0, 10);
        if(date >= start_date){
            return true;
        }
        return false;
    }

    function getByCounty(data, county){
        let countyData = processedData.filter(e => e['County'] == county);
        return countyData;
    }

    function createTraces(){
        traces = [];
        let counties = [... new Set(processedData.map(e => e['County']))];
        let removeCounty = "Unknown";
        for(let county of counties){
            if(county != removeCounty){
                let trace = {};
                let countyData = getByCounty(processedData, county);
                trace['x'] = unpack(countyData, 'Confirmed');
                trace['y'] = unpack(countyData, 'Deaths');
                trace['text'] = dates;
                trace['mode'] = 'lines+markers';
                trace['name'] = county;
                trace['hoverinfo'] = 'x+y+text';
                trace['customdata'] = countyData.map(e => e['County']);
                trace['hovertemplate'] = '<b>%{customdata}</b>'+
                    '<br><b>Date: </b> %{text}'+
                    '<br><b>Deaths:</b> %{y}'+
                    '<br><b>Total Cases:</b> %{x}'+
                    '<extra></extra>';
                traces.push(trace);
            }
        }
    }

    function unpack(data, key){
        // return data.map(e => Math.log10(parseFloat(e[key])+1));
        return data.map(e => e[key]);
    }

    function getFrameData(date){
        let counties = [... new Set(processedData.map(e => e['County']))];
        let data = [];
        for(let county of counties){
            if(county != "Unknown") {
                let trace = {x: [], y: []};
                let countyData = getByCounty(processedData, county);
                let index = dates.indexOf(date);
                let confirmed = unpack(countyData, 'Confirmed');
                let deaths = unpack(countyData, 'Deaths');
                // let frameData = countyData.filter(e => e['Date'] == date);
                trace.x = confirmed.slice(0, index + 1);
                trace.y = deaths.slice(0, index + 1);
                trace.id = county;

                data.push(trace);
            }
        }

        return data;
    }

    function createFrames(){
        frames = [];
        for(let date of dates){
            frames.push({
                name: date,
                data: getFrameData(date)
            })
        }
    }
    // debugger;

    function createSliderSteps(){
        for (i = 0; i < dates.length; i++) {
            sliderSteps.push({
                method: 'animate',
                label: dates[i],
                args: [[dates[i]], {
                    mode: 'immediate',
                    transition: {duration: 300},
                    frame: {duration: 200, redraw: true},
                }]
            });
        }
    }
}


function plot(){
    var layout = {
            // autosize: false,
            hovermode: 'closest',
            height: 750,
            title:'COVID-19: Deaths vs Cases',
            xaxis:{
                title: "Number of Total Cases",
                titlefont: {
                    family: 'Arial, sans-serif',
                    size: 18,
                    color: 'black'
                },
                tickfont: {
                    family: 'Old Standard TT, serif',
                    size: 16,
                    color: 'black'
                }
            },
            yaxis:{
                title: "Number of Total Deaths",
                titlefont: {
                    family: 'Arial, sans-serif',
                    size: 18,
                    color: 'black'
                },
                tickfont: {
                    family: 'Old Standard TT, serif',
                    size: 16,
                    color: 'black'
                }
            },
            updatemenus: [{
                x: 0,
                y: 0,
                yanchor: 'top',
                xanchor: 'left',
                showactive: false,
                direction: 'left',
                type: 'buttons',
                pad: {t: 87, r: 10},
                buttons: [{
                    method: 'animate',
                    args: [null, {
                        mode: 'immediate',
                        fromcurrent: true,
                        transition: {duration: 0},
                        frame: {duration: 300, redraw: true}
                    }],
                    label: 'Play'
                }, {
                    method: 'animate',
                    args: [[null], {
                        mode: 'immediate',
                        transition: {duration: 0},
                        frame: {duration: 0, redraw: false}
                    }],
                    label: 'Pause'
                }]
            }],

            sliders: [{
                pad: {l: 130, t: 55},
                currentvalue: {
                    visible: true,
                    prefix: 'Date:',
                    xanchor: 'right',
                    font: {size: 14, color: '#ff0000'}
                },
                steps: sliderSteps
            }]
        };
    Plotly.newPlot('myPlot',{
        data: traces,
        layout: layout,
        frames: frames,
        config: config
    });
}


