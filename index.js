const rescue_org_url = "https://api.rescuegroups.org/http/";
const yelp_url = "https://api.yelp.com/v3/businesses/search";
const cors_url = "https://cors-anywhere.herokuapp.com/";
const yelp_key = "SWqIeR03-4XLVB2rjSFheWjyG83SJbP_2TlwQGQF1AJhCq77pgSLmihlbN6TDYNg5ErnOPjjRs2YrRLeqx_riAQDuUXQdOb-pcv-ktebeXRa_BT3Wf7gNaS5j_teW3Yx";
const google_maps_key = "AIzaSyCeqMDyG-nlak99Pbi88_TATn2xc5WQZEE";
let map;
let vetsData;
let storesData;

function initMap(coordinates) {
    map = new google.maps.Map(document.getElementById('map'), {
        center: coordinates,
        zoom: 11
    });
    //drawMarkers(locations, labels);
}



function generateInfoWindowOnMap(contentString) {
var infowindow = new google.maps.InfoWindow({
    content: contentString,
    maxWidth: 200
});
}

function generateMarkerInfo(coordinates, data) {
var marker = new google.maps.Marker({
    position: coordinates,
    map: map,
    title: 'data.businesses[item].name'
});

marker.addListener('click', function () {
    infowindow.open(map, marker);
});
}

function drawMarkers(data, locations, labels) {
    let color = "purple"
    if (labels == "12345") {
        color = "orangered";
    }
    var markers = locations.map(function (location, i) {
        return new google.maps.Marker({
            position: location,
            map: map,
            label: labels[i % labels.length],
            title: data.businesses[i].name,
        });

    });
    var circleMarker = locations.map(function (location) {
        return new google.maps.Circle({
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.35,
            position: location,
            radius: 600,
            center: location,
            map: map,
        });
        
    });
    //circleMarker.bindTo('center', markers, 'position');
    //markers.setVisible(false);
    
}    


function getDataFromYelp (searchTerm, zipcode, callback, page) {
    let settings = {
        url: cors_url+yelp_url,
        headers: {authorization: `Bearer ${yelp_key}`},
        data: {
            term: searchTerm,
            location: zipcode,
            radius: 24140,
            limit: 5,
            offset: page,
        },
        type: "GET",
        dataType: "json",
        success: callback,
        fail: handleErrors,
    };
    return $.ajax(settings);

}

function getVetData(zipcode, page, callback) {
    let term = "veterinarians";
    return getDataFromYelp(term, zipcode, callback, page);

}

function getPetStoreData(zipcode, page, callback) {
    let term = "pet stores";
    return getDataFromYelp(term, zipcode, callback, page);
}

function generateButtonString(data, item, labels) {
    return `<button type="button" role="button" class="option${labels.charAt(item)}" data-option="option${labels.charAt(item)}">
                ${labels.charAt(item)}.   ${data.businesses[item].name}</button>`
}

function generateBizInfoString(selected) {
    let label = "ABCDE";
    let data = storesData;
    let item = selected.charAt(6)-1;
    if (label.indexOf(selected.charAt(6)) >= 0) {
        data = vetsData;
        item = label.indexOf(selected.charAt(6));
    }
    return `<h2>${data.businesses[item].name}</h2>
                    <p>${data.businesses[item].location.display_address[0]}</p>
                    <p>${data.businesses[item].display_phone}</p>
                    <img src="${data.businesses[item].image_url}">`;
}


function generateObjectWithCoordinates(data, item) {
    let coordinates = {};
    coordinates.lng = data.businesses[item].coordinates.longitude;
    coordinates.lat = data.businesses[item].coordinates.latitude;
    return coordinates;
}


function displayVetsResults(data) {
    vetsData = data;
    let vetsString = [];
    let vetsCoordinates = [];
    var labels = 'ABCDE';
    vetsString.push(`<h2>Vets</h2>`);
    if (!vetsData||!vetsData.businesses||!vetsData.businesses.length) {
        vetsString.push(`<p>No Results</p>`);
        return data;
    }
    for(let i=0; i< vetsData.businesses.length; i++) {
        vetsString.push(generateButtonString(vetsData, i, labels));
        vetsCoordinates.push(generateObjectWithCoordinates(vetsData, i));
    }
    vetsString.join("");
    $('.js-vets-results').html(vetsString);
    drawMarkers(vetsData, vetsCoordinates, labels);
    return data;
}

function setCenterOfMap(coordinateOrFirstResults, secondResults) {
    let coordinate = coordinateOrFirstResults;
    let allLong = [];
    let allLat = [];
   
   
    if(arguments.length === 2) {
        for(let i=0; i<coordinateOrFirstResults.businesses.length; i++) {
            allLong.push(coordinateOrFirstResults.businesses[i].coordinates.longitude);
            allLat.push(coordinateOrFirstResults.businesses[i].coordinates.latitude);
        }
        for(let i=0; i<secondResults.businesses.length; i++) {
            allLong.push(secondResults.businesses[i].coordinates.longitude);
            allLat.push(secondResults.businesses[i].coordinates.latitude);
        }
        allLong.sort();
        allLat.sort();
        console.log(allLong);
        console.log(allLat);
        let averageLong = allLong[0]+(Math.abs(allLong[allLong.length-1]) - Math.abs(allLong[0]))/2;
        let averageLat = allLat[0] + (Math.abs(allLat[allLat.length - 1]) - Math.abs(allLat[0])) / 2;
        coordinate = {lng: averageLong,
                        lat: averageLat
                    }
    }
    if(map){
        map.setCenter(coordinate);
    }
}

function displayPetStoresResults(data) {
    storesData = data;
    let storesString = [];
    let storesCoordinates = [];
    var labels = '12345';
    storesString.push(`<h2>Pet Stores</h2>`);
    if (!storesData || !storesData.businesses || !storesData.businesses.length) {
        storesString.push(`<p>No Results</p>`);
        return data;
    }
    for (let i = 0; i<storesData.businesses.length; i++) {
        storesString.push(generateButtonString(storesData, i, labels));
        storesCoordinates.push(generateObjectWithCoordinates(storesData, i));
    }
    storesString.join("");
    $('.js-pet-stores-results').html(storesString);
    drawMarkers(storesData, storesCoordinates, labels);
    return data;
}

function handleErrors(xhr, status, error) {
    console.log('error ' + error);
}

function displayPopUpWithInfo(selected) {
    $('.js-popup-window').html(generateBizInfoString(selected)).show();
}

function handleOptions(event) {
    event.stopPropagation();
    let selected = $(event.currentTarget).attr('data-option');
    displayPopUpWithInfo(selected);
}

function watchOptions() {
    $('.js-vets-results, .js-pet-stores-results').on('click', 'button', handleOptions);
}

function handleSearch(event) {
    event.preventDefault();
    $('.js-vets-results, .js-pet-stores-results, #map').hide();
    vetsData = {};
    storesData = {};
    let zipcodeInput = $('#zip-code');
    let zipcode = zipcodeInput.val();
    zipcodeInput.val("");
    let page = 0;
    return getPetStoreData(zipcode, page)
        .then(petStores=> {
            return getVetData(zipcode, page)
                .then(vets=> {
                    if(vets.businesses.length || petStores.businesses.length){
                    //if code reaches here, both requests have been succesful
                    setCenterOfMap(vets, petStores);   
                    displayPetStoresResults(petStores);
                    displayVetsResults(vets);
                    $('.js-vets-results, .js-pet-stores-results, #map').show();
                    }
                    else {
                        displayPetStoresResults(petStores);
                        displayVetsResults(vets);
                        $('.js-vets-results, .js-pet-stores-results').show();
                    }
                  
                    
            })
        ;    
        })
    ; 

}

function watchSubmitButton() {
    $('.js-form').on('submit', handleSearch);
    
}

function main() {
    watchSubmitButton();
    watchOptions();
}

$(main);