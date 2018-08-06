const rescue_org_url = "https://api.rescuegroups.org/http/";
const yelp_url = "https://api.yelp.com/v3/businesses/search";
const cors_url = "https://cors-anywhere.herokuapp.com/";
const yelp_key = "SWqIeR03-4XLVB2rjSFheWjyG83SJbP_2TlwQGQF1AJhCq77pgSLmihlbN6TDYNg5ErnOPjjRs2YrRLeqx_riAQDuUXQdOb-pcv-ktebeXRa_BT3Wf7gNaS5j_teW3Yx";
let map;
let vetsData;
let storesData;
let zipcode;
let vetsCoordinates =[];
let storesCoordinates = [];
let vetsMarkers = [];
let storesMarkers = [];

function initMap(coordinates) {
    map = new google.maps.Map(document.getElementById('map'), {
        center: coordinates,
        zoom: 11
    });
    //drawMarkers(locations, labels);
}

// function generateInfoWindowOnMap(contentString) {
//     var infowindow = new google.maps.InfoWindow({
//         content: contentString,
//         maxWidth: 200
//     });
// }

// function generateMarkerInfo(coordinates) {
//     var marker = new google.maps.Marker({
//         position: coordinates,
//         map: map,
//         title: 'data.businesses[item].name'
//     });
   
//     marker.addListener('click', function () {
//         infowindow.open(map, marker);
//     });
// }

function drawMarkers(data, locations, labels) {
    let color = (labels == "12345") ? "orangered" : "purple";
  
    let markers = locations.map(function (location, i) {
        return new google.maps.Marker({
            position: location,
            map: map,
            label: labels[i % labels.length],
            title: data.businesses[i].name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: color,
                fillOpacity: 0.75,
                strokeWeight: 0.4
            },
        });
    });

    if (labels == "12345") {
        storesMarkers = markers;
    }
    else {
        vetsMarkers = markers;
    }
}

function deleteMarkers(markers) {     
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    return markers;
}


function getDataFromYelp(searchTerm, zipcode, callback, page) {
    let settings = {
        url: cors_url + yelp_url,
        headers: {
            authorization: `Bearer ${yelp_key}`
        },
        data: {
            term: searchTerm,
            location: zipcode,
            radius: 24140,
            limit: 5,
            offset: page * 5,
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
    return `<button type="button" role="button" class="option js-option" data-option="option${labels.charAt(item)}">
                ${labels.charAt(item)}.  ${data.businesses[item].name}</button>`;
}

function generateBizInfoString(selected) {
    let label = "ABCDE";
    let data = storesData;
    let item = selected.charAt(6) - 1;
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


function displayVetsResults(data, page) {
    vetsData = data;
    let vetsString = [];
    let labels = 'ABCDE';
    vetsString.push(`<h2>Vets</h2>`);
    if (!vetsData || !vetsData.businesses || !vetsData.businesses.length) {
        vetsString.push(`<p>Sorry, no results</p>`);
        vetsString.join("");
        $('.js-vets-results').html(vetsString);
        return data;

    }
    vetsString.push(`<p>5 results out of ${data.total}</p>`);
    for (let i = 0; i < vetsData.businesses.length; i++) {
        vetsString.push(generateButtonString(vetsData, i, labels));
        vetsCoordinates.push(generateObjectWithCoordinates(vetsData, i));
    }
    vetsString.push(generateNextPrevButtons("vets", page));
    vetsString.join("");
    $('.js-vets-results').html(vetsString);
    drawMarkers(vetsData, vetsCoordinates, labels);
    return data;
}

function setCenterOfMap(coordinateOrFirstResults, secondResults) {
    let coordinate = coordinateOrFirstResults;
    let allLong = [];
    let allLat = [];

    if (arguments.length === 2) {
        for (let i = 0; i < coordinateOrFirstResults.businesses.length; i++) {
            allLong.push(coordinateOrFirstResults.businesses[i].coordinates.longitude);
            allLat.push(coordinateOrFirstResults.businesses[i].coordinates.latitude);
        }
        for (let i = 0; i < secondResults.businesses.length; i++) {
            allLong.push(secondResults.businesses[i].coordinates.longitude);
            allLat.push(secondResults.businesses[i].coordinates.latitude);
        }
        allLong.sort();
        allLat.sort();
     
        let averageLong = allLong[0] + (allLong[allLong.length - 1] - allLong[0]) / 2;
        let averageLat = allLat[0] + (allLat[allLat.length - 1] - allLat[0]) / 2;
        coordinate = {
            lng: averageLong,
            lat: averageLat
        }
    }
    if (map) {
        map.setCenter(coordinate);
    }
}

function generateNextPrevButtons(term, page) {
    let prevPage = (page !== 0) ? page-1 : 0;
    return `<button role="button" type="button" data-page="${prevPage}" data-term="${term}" class="next-prev js-prev">Prev</button>
            <button role="button" type="button" data-page="${page+1}" data-term="${term}" class="next-prev js-next">Next</button>`;
}

function displayPetStoresResults(data, page) {
    storesData = data;
    let storesString = [];
    let labels = '12345';
    storesString.push(`<h2>Pet Stores</h2>`);
    if (!storesData || !storesData.businesses || !storesData.businesses.length) {
        storesString.push(`<p>Sorry, no results</p>`);
        storesString.join("");
        $('.js-pet-stores-results').html(storesString);
        return data;
    }
    storesString.push(`<p>5 results out of ${data.total}</p>`);
    for (let i = 0; i < storesData.businesses.length; i++) {
        storesString.push(generateButtonString(storesData, i, labels));
        storesCoordinates.push(generateObjectWithCoordinates(storesData, i));
    }
    storesString.push(generateNextPrevButtons("stores", page));
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
    $('.js-vets-results, .js-pet-stores-results').on('click', '.js-option', handleOptions);
    $('.js-vets-results, .js-pet-stores-results').on('click', '.js-prev, .js-next', handleNextPrevButton);
 }

function handleNextPrevButton(event) {
    event.stopPropagation();
    let page = parseInt($(event.currentTarget).attr('data-page'));
    let term = $(event.currentTarget).attr('data-term');
    if (term === "vets") {
        deleteMarkers(vetsMarkers);
        vetsCoordinates = [];
                return getVetData(zipcode, page)
        .then(vets => {
            vetsData = vets;
                        console.log(vetsData);
                        if (vetsData.businesses.length || storesData.businesses.length) {
                            //if code reaches here, both requests have been succesful
                            setCenterOfMap(vetsData, storesData);
                            displayVetsResults(vetsData, page);
                        }
                    });       
    }
    else {
        deleteMarkers(storesMarkers);
        storesCoordinates = [];
                return getPetStoreData(zipcode, page)
            .then(petStores => {
                storesData = petStores;
                    console.log(storesData);
                    if (vetsData.businesses.length || storesData.businesses.length) {
                        //if code reaches here, both requests have been succesful
                        setCenterOfMap(vetsData, storesData);
                        displayPetStoresResults(storesData, page);
                    }
                });
    }
}

function handleSearch(event) {
    event.preventDefault();
    $('.js-vets-results, .js-pet-stores-results, #map').hide();
    vetsData = {};
    storesData = {};
    vetsCoordinates = [];
    storesCoordinates = [];
    zipcode = 0;
    let zipcodeInput = $('#zip-code');
    zipcode = zipcodeInput.val();
    zipcodeInput.val("");
    let vetsPage = 0;
    let storesPage = 0;
    return getPetStoreData(zipcode, storesPage)
        .then(petStores => {
            storesData = petStores;
            return getVetData(zipcode, vetsPage)
                .then(vets => {
                    vetsData = vets;
                    displayPetStoresResults(storesData, storesPage);
                    displayVetsResults(vetsData, vetsPage);
                    if (vetsData.businesses.length || storesData.businesses.length) {
                        setCenterOfMap(vets, petStores);
                        $('.js-vets-results, .js-pet-stores-results, #map').show();
                    } 
                    else {
                        $('.js-vets-results, .js-pet-stores-results').show();
                    }


                });
        });

}

function watchSubmitButton() {
    $('.js-form').on('submit', handleSearch);

}

function main() {
    watchSubmitButton();
    watchOptions();
}

$(main);