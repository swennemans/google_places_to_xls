import axios from 'axios';
import promise from 'bluebird';
import json2xls from 'json2xls';
import fs from 'fs';

const location = '52.3634418,4.9334624'
const radius = 50000;

const keyword = "huisarts";

import key from './key'


// Google API URLS ****
const PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?" + "key=" + key + "&location=" + location + "&radius=" + radius + "&keyword=" + keyword;
const getDetailsURL = (id) => {
  return 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + id + '&key=' + key;
}

/**
 * Request places based on location, radius and keyword.
 * @return {Array[String]} [Return array with place_ids]
 */
const getPlaces = () => {
  return axios.get(PLACES_URL)
  .then(( { data }) => {
    return data.results.map((place) => (place.place_id))
  })
  .catch(function (error) {
    console.log(error);
  });
};

/**
 * Request the places details by place_id, return array of promises
 * @param  {Array} places
 * @return {Promise}
 */
const getPlacesDetails = (places) => {
  const requests = places.map((place) => ( axios.get(getDetailsURL(place)) ))
  return Promise.all(requests).then((result) => (result))
};

/**
 * Format response data so that json2xls can handle it.
 * @param  {Array} response  [Array of response data]
 * @return {Array[Object]}
 */
const formatData = (response) => {
  return response.map(({ data }) => {
    const obj = {};
    obj["Naam"] = data.result.name;
    obj["Adres"] = data.result.formatted_address;
    obj["Telefoonnummer"] = data.result.formatted_phone_number;
    obj["Website"] = data.result.website ? data.result.website : 'geen website';
    obj["Openingstijden"] = data.result.opening_hours ? data.result.opening_hours.weekday_text : 'geen openingstijden opgegeven';
    return obj;
  })
};

/**
 * write formatted data to XLS
 * @param  {Array[Object]} data
 */
const writeToXLS = (data) => {
  const xls = json2xls(data);
  fs.writeFileSync(`${keyword}.xlsx`, xls, 'binary');
};


/**
 * Start function
 */
const init = async function() {
  try {
    const result = await getPlaces();
    const response = await getPlacesDetails(result);
    const formattedData = formatData(response);
    writeToXLS(formattedData);
  }
  catch(error) {
    console.log('error', error)
  }
}


init()
