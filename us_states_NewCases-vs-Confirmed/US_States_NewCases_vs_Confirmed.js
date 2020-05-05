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
    Plotly.d3.csv("us_states_historic_data.csv", function(err, data){
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
        ymax = Math.max(ymax, parseFloat(e['New_Cases_Weekly']));
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
        let start_date = new Date(2020, "01", "01").toISOString().slice(0, 10);
        if(date >= start_date){
            return true;
        }
        return false;
    }

    function getByState(data, state){
        let stateData = processedData.filter(e => e['State'] == state);
        return stateData;
    }

    function createTraces(){
        traces = [];
        let states = [... new Set(processedData.map(e => e['State']))];
        let removeCounty = "Unknown";
        for(let state of states){
            let trace = {};
            let stateData = getByState(processedData, state);
            trace['x'] = unpack(stateData, 'Confirmed');
            trace['y'] = unpack(stateData, 'New_Cases_Weekly');
            trace['text'] = dates;
            trace['mode'] = 'lines+markers';
            trace['name'] = state;
            trace['hoverinfo'] = 'x+y+text';
            trace['customdata'] = stateData.map(e => e['State']);
            trace['hovertemplate'] = '<b>%{customdata}</b>'+
                '<br><b>Date: </b> %{text}'+
                '<br><b>New Cases (7-day rolling average):</b> %{y:.2f}'+
                '<br><b>Total Cases:</b> %{x}'+
                '<extra></extra>';
            traces.push(trace);

        }
    }

    function unpack(data, key){
        // return data.map(e => Math.log10(parseFloat(e[key])+1));
        return data.map(e => e[key]);
    }

    function getFrameData(date){
        let states = [... new Set(processedData.map(e => e['State']))];
        let data = [];
        for(let state of states){

            let trace = {x:[], y:[]};
            let stateData = getByState(processedData, state);
            let index = dates.indexOf(date);
            console.log(index);
            let confirmed = unpack(stateData, 'Confirmed');
            let new_cases_weekly = unpack(stateData, 'New_Cases_Weekly');
            trace.x = confirmed.slice(0, index+1);
            trace.y = new_cases_weekly.slice(0, index+1);
            trace.id = state;
            data.push(trace);

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
    var myPlot = document.getElementById('myPlot'),
        hoverInfo = document.getElementById('hoverinfo'),
        layout = {
            // autosize: false,
            hovermode: 'closest',
            height: 750,
            title:'COVID-19: New Cases vs Total Cases - Logarithmic Scale',
            xaxis:{
                title: "Total Cases",
                type: 'log',
                dtick: 1
                // tickvals: xticks
            },
            yaxis:{
                title: "New Cases Weekly , 7-day average",
                type: 'log',
                tick0: 1,
                // tickmode: "linear",
                dtick: 1,
                // tickvals: yticks
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
                    font: {size: 20, color: '#666'}
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


