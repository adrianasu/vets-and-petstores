const rescue_org_url = "https://api.rescuegroups.org/http/";
const yelp_url = "https://api.yelp.com/v3/businesses/search";
const cors_url = "https://cors-anywhere.herokuapp.com/";
const yelp_key = "SWqIeR03-4XLVB2rjSFheWjyG83SJbP_2TlwQGQF1AJhCq77pgSLmihlbN6TDYNg5ErnOPjjRs2YrRLeqx_riAQDuUXQdOb-pcv-ktebeXRa_BT3Wf7gNaS5j_teW3Yx";
const google_maps_key = "AIzaSyCeqMDyG-nlak99Pbi88_TATn2xc5WQZEE";
let map;

function initMap(coordinates) {
    map = new google.maps.Map(document.getElementById('map'), {
        center: coordinates,
        zoom: 15
    });
}

function getDataFromYelp (searchTerm, zipcode, callback, page) {
    var settings = {
        url: cors_url+yelp_url,
        headers: {authorization: `Bearer ${yelp_key}`},
        data: {
            term: searchTerm,
            location: zipcode,
            radius: 32186,
            limit: 10,
            offset: page,
        },
        type: "GET",
        dataType: "json",
        success: callback,
        fail: handleErrors,
    };
    $.ajax(settings);

}

function getVetData(zipcode, page) {
    let term = "veterinarians";
    getDataFromYelp(term, zipcode, displayVetsResults, page);
}

function getPetStoreData(zipcode, page) {
    let term = "pet stores";
    getDataFromYelp(term, zipcode, displayPetStoresResults, page);
}

function generateString(data, item) {
    return `<h2>${data.businesses[item].name}</h2>
            <p>${data.businesses[item].location.display_address[0]}</p>
            <p>${data.businesses[item].display_phone}</p>
            <img src="${data.businesses[item].image_url}">`;
}

function generateArrayWithCoordinates(data, item) {
    let coordinates = {};
    coordinates.lng = data.businesses[item].coordinates.longitude;
    coordinates.lat = data.businesses[item].coordinates.latitude;
    return coordinates;
}

function displayVetsResults(vetsData) {
    let vetsString = [];
    let vetsCoordinates = [];
    for(let i=0; i<= vetsData.businesses.length-1; i++) {
        vetsString.push(generateString(vetsData, i));
        vetsCoordinates.push(generateArrayWithCoordinates(vetsData, i));
    }
    vetsString.join("");
    $('.js-vets-results').html(vetsString);
    let center = vetsCoordinates[0];
    initMap(center);
}

function displayPetStoresResults(storesData) {
    let storesString = [];
    let storesCoordinates = [];
    for (let i = 0; i<= storesData.businesses.length-1; i++) {
        storesString.push(generateString(storesData, i));
        storesCoordinates.push(generateArrayWithCoordinates(storesData, i));
    }
    storesString.join("");
    $('.js-pet-stores-results').html(storesString);
    console.log(storesCoordinates);

}

function handleErrors(xhr, status, error) {
    console.log('error ' + error);
}


function handleSearch(event) {
    event.preventDefault();
    let animalInput = $('#animal');
    let animal = animalInput.val();
    animalInput.val("");
    let zipcodeInput = $('#zip-code');
    let zipcode = zipcodeInput.val();
    zipcodeInput.val("");
    console.log("zipcode " +zipcode);
    getVetData(zipcode, 0);
    getPetStoreData(zipcode, 0);

}


function watchSubmitButton() {
    $('.js-form').on('submit', handleSearch);
}

function main() {
    watchSubmitButton();

}

$(main);