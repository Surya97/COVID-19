import requests
from requests_ntlm import HttpNtlmAuth
import json
import numpy as np
import pandas as pd
from tqdm import tqdm
from datetime import datetime, timedelta

us_states_historical_data = "https://covidtracking.com/api/states/daily"
us_overall_historical_data = "https://covidtracking.com/api/us/daily"
JHU_US_Confirmed_timeseries = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv"
JHU_US_deaths_timeseries = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv"
JHU_world_confirmed_timeseries = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv"
JHU_world_deaths_timeseries = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv"
NY_county_timeseries = "https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv"

JHU_US_Confirmed_df = pd.DataFrame()
JHU_US_Deaths_df = pd.DataFrame()
us_states_historical_df = pd.DataFrame()
us_overall_historical_df = pd.DataFrame()
JHU_world_confirmed_df = pd.DataFrame()
JHU_world_deaths_df = pd.DataFrame()
US_county_df = pd.DataFrame


def get_data():
    global us_states_historical_df
    global JHU_US_Confirmed_df
    global JHU_US_Deaths_df
    global us_overall_historical_df
    global JHU_world_confirmed_df
    global JHU_world_deaths_df
    global US_county_df

    # us_states_historical_df = pd.DataFrame(requests.get(us_states_historical_data).json())
    # us_overall_historical_df = pd.DataFrame(requests.get(us_overall_historical_data).json())
    JHU_US_Confirmed_df = pd.read_csv(JHU_US_Confirmed_timeseries, error_bad_lines=False)
    JHU_US_Deaths_df = pd.read_csv(JHU_US_deaths_timeseries, error_bad_lines=False)
    JHU_world_confirmed_df = pd.read_csv(JHU_world_confirmed_timeseries, error_bad_lines=False)
    JHU_world_deaths_df = pd.read_csv(JHU_world_deaths_timeseries, error_bad_lines=False)
    US_county_df = pd.read_csv(NY_county_timeseries, error_bad_lines=False)

    # us_states_historical_df.to_csv('../data/US_States_historical.csv', index=False)
    # us_overall_historical_df.to_csv('../data/US_Overall_historical.csv', index=False)


def process_world_data():
    print('Processing World Data')
    global JHU_world_confirmed_df
    global JHU_world_deaths_df

    JHU_world_confirmed_df = JHU_world_confirmed_df.drop(['Lat', 'Long', 'Province/State'], axis=1)
    JHU_world_deaths_df = JHU_world_deaths_df.drop(['Lat', 'Long', 'Province/State'], axis=1)

    JHU_world_confirmed_df = JHU_world_confirmed_df.groupby('Country/Region').sum().astype(int)
    JHU_world_deaths_df = JHU_world_deaths_df.groupby('Country/Region').sum().astype(int)

    JHU_world_confirmed_df = JHU_world_confirmed_df.transpose()
    JHU_world_deaths_df = JHU_world_deaths_df.transpose()

    JHU_world_confirmed_df.index.name = 'Date'
    JHU_world_deaths_df.index.name = 'Date'

    JHU_world_confirmed_df.index = pd.to_datetime(JHU_world_confirmed_df.index)
    JHU_world_deaths_df.index = pd.to_datetime(JHU_world_deaths_df.index)

    dates = JHU_world_confirmed_df.index.values
    countries = list(JHU_world_confirmed_df.columns)
    world_data_df = pd.DataFrame(columns=['Date', 'Country', 'Confirmed', 'Deaths', 'New_Cases'])

    for country in tqdm(countries):
        prev = 0
        for date in dates:
            temp_data = dict()
            temp_data['Date'] = date
            temp_data['Country'] = country
            temp_data['Confirmed'] = JHU_world_confirmed_df.loc[date, country]
            temp_data['New_Cases'] = temp_data['Confirmed'] - prev
            prev = temp_data['Confirmed']
            temp_data['Deaths'] = JHU_world_deaths_df.loc[date, country]

            world_data_df = world_data_df.append(temp_data, ignore_index=True)

    world_data_df.to_csv('../data/World_historical.csv', index=False)


def process_state_county_data(state):
    print('Processing', state, 'data')
    global JHU_US_Confirmed_df
    global JHU_US_Deaths_df

    JHU_US_Confirmed_df = JHU_US_Confirmed_df[JHU_US_Confirmed_df['Province_State'] == state].reset_index(drop=True)
    JHU_US_Deaths_df = JHU_US_Deaths_df[JHU_US_Deaths_df['Province_State'] == state].reset_index(drop=True)

    JHU_US_Confirmed_df.rename(columns={"Admin2": "County"}, inplace=True)
    JHU_US_Deaths_df.rename(columns={"Admin2": "County"}, inplace=True)

    JHU_US_Confirmed_df = JHU_US_Confirmed_df.drop(['UID', 'iso2', 'iso3', 'code3', 'FIPS', 'Province_State', 'Country_Region', 'Lat', 'Long_', 'Combined_Key'], axis=1)

    JHU_US_Deaths_df = JHU_US_Deaths_df.drop(['UID', 'iso2', 'iso3', 'code3', 'FIPS', 'Province_State', 'Country_Region', 'Lat', 'Long_', 'Combined_Key', 'Population'], axis=1)

    JHU_US_Confirmed_df = JHU_US_Confirmed_df.groupby('County').sum().astype(int)
    JHU_US_Deaths_df = JHU_US_Deaths_df.groupby('County').sum().astype(int)

    JHU_US_Confirmed_df = JHU_US_Confirmed_df.transpose()
    JHU_US_Deaths_df = JHU_US_Deaths_df.transpose()

    JHU_US_Confirmed_df.index.name = 'Date'
    JHU_US_Deaths_df.index.name = 'Date'

    JHU_US_Confirmed_df.index = pd.to_datetime(JHU_US_Confirmed_df.index)
    JHU_US_Deaths_df.index = pd.to_datetime(JHU_US_Deaths_df.index)

    dates = JHU_US_Confirmed_df.index.values
    counties = list(JHU_US_Confirmed_df.columns)
    state_data_df = pd.DataFrame(columns=['Date', 'Country', 'Confirmed', 'Deaths', 'New_Cases', 'New_Cases_Weekly'])

    for county in tqdm(counties):
        prev = 0
        for date in dates:
            temp_data = dict()
            temp_data['Date'] = date
            temp_data['County'] = county
            temp_data['Confirmed'] = JHU_US_Confirmed_df.loc[date, county]
            temp_data['New_Cases'] = temp_data['Confirmed'] - prev
            prev = temp_data['Confirmed']
            temp_data['Deaths'] = JHU_US_Deaths_df.loc[date, county]

            state_data_df = state_data_df.append(temp_data, ignore_index=True)

    new_cases_weekly = state_data_df.groupby('County', as_index=False).New_Cases.rolling(7).mean()
    state_data_df['New_Cases_Weekly'] = new_cases_weekly.reset_index(level=0, drop=True)

    state_data_df.to_csv('../data/' + state + '_county_historic_data.csv', index=False)


def process_county_data(state):
    print('Processing', state, 'data')
    global US_county_df

    state_county_df = US_county_df[US_county_df['state'] == state].reset_index(drop=True)

    state_county_df.rename(columns={"date": "Date", "county": "County", "cases": "Confirmed", "deaths": "Deaths",
                                    "state": "State"}, inplace=True)

    # state_county_df['Date'] = pd.to_datetime(state_county_df['Date'])
    # state_county_df = state_county_df[state_county_df['Date'] >= '2020-03-01']

    #.fillna(0)



    # Adding missing counties for each Date

    counties = set(state_county_df['County'])
    # dates = list(set(state_county_df['Date']))
    # dates = sorted(dates, key=lambda x: datetime.strptime(x, '%Y-%m-%d'))
    # print(dates)
    # start_date = (datetime.strptime(dates[0], '%Y-%m-%d') - timedelta(1)).strftime('%Y-%m-%d')
    #
    # print('start_Date', start_date)
    #
    # for county in counties:
    #     county_temp = dict()
    #     county_temp['Date'] = start_date
    #     county_temp['County'] = county
    #     county_temp['State'] = state
    #     county_temp['Confirmed'] = 1
    #     county_temp['Deaths'] = 1
    #     county_temp['New_Cases'] = 1
    #     county_temp['New_Cases_Weekly'] = 1
    #
    #     state_county_df = state_county_df.append(county_temp, ignore_index=True)
    #
    grouped = state_county_df.groupby(['Date'])

    for name, group in tqdm(grouped):
        temp = group
        for county in counties:
            if county not in temp['County'].values:
                county_temp = dict()
                county_temp['Date'] = name
                county_temp['County'] = county
                county_temp['State'] = state
                county_temp['Confirmed'] = 0
                county_temp['Deaths'] = 0

                state_county_df = state_county_df.append(county_temp, ignore_index=True)

    state_county_df.reset_index(drop=True)
    state_county_df = state_county_df.sort_values(by=['County', 'Date']).reset_index(drop=True)
    state_county_df['New_Cases'] = state_county_df.groupby(['County']).Confirmed.transform(
        lambda x: x.diff()).fillna(0)

    state_county_df.reset_index(drop=True)
    state_county_df.New_Cases = np.where(state_county_df.New_Cases < 0, 0, state_county_df.New_Cases)
    # print(state_county_df[state_county_df['County'] == 'Navajo'])

    state_county_df['New_Cases_Weekly'] = state_county_df.groupby(['County']).New_Cases.transform(
        lambda x: x.rolling(7).mean())

    state_county_final = state_county_df.sort_values(by=['County', 'Date']).reset_index(drop=True)

    state_county_final.to_csv('../data/' + state + '_county_historic_data.csv', index=False)


if __name__ == "__main__":
    get_data()
    # process_state_county_data("Arizona")
    process_county_data("Arizona")
    # process_world_data()

