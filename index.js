const rescue_org_url = "https://api.rescuegroups.org/http/";
const yelp_url = "https://api.yelp.com/v3/businesses/search";
const cors_url = "https://cors-anywhere.herokuapp.com/";
const yelp_key = "SWqIeR03-4XLVB2rjSFheWjyG83SJbP_2TlwQGQF1AJhCq77pgSLmihlbN6TDYNg5ErnOPjjRs2YrRLeqx_riAQDuUXQdOb-pcv-ktebeXRa_BT3Wf7gNaS5j_teW3Yx";
let map;
let vetsData;
let storesData;
let zipcode;
let sortBy;
let vetsCoordinates = [];
let storesCoordinates = [];
let vetsMarkers = [];
let storesMarkers = [];

function initMap(coordinates) {
    map = new google.maps.Map(document.getElementById('map'), {
        center: coordinates,
        zoom: 10
    });
}

function drawMarkers(data, locations, labels) {
    let color = (labels == "1234") ? "orangered" : "purple";

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

    if (labels == "1234") {
        storesMarkers = markers;
    } else {
        vetsMarkers = markers;
    }
}

function deleteMarkers(markers) {
    for (let i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    return markers;
}

function getDataFromYelp(searchTerm, zipcode, callback, page, sortBy) {
    let settings = {
        url: cors_url + yelp_url,
        headers: {
            authorization: `Bearer ${yelp_key}`
        },
        data: {
            term: searchTerm,
            location: zipcode,
            limit: 4,
            offset: page * 4,
            sort_by: sortBy,
            radius: 16092
        },
        type: "GET",
        dataType: "json",
        success: callback
    };
    return $.ajax(settings);
}

function getVetData(zipcode, page, sortBy, callback) {
    let term = "veterinarians";
    return getDataFromYelp(term, zipcode, callback, page, sortBy)
        .catch(handleYelpError);
}

function handleYelpError(xhr) {
    let message = "Something went wrong, please try again";
    if (xhr && xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.description) {
        message = xhr.responseJSON.error.description;
    }
    showAndHideElements();
    $('.js-errors>p').html(message).show();
}

function getPetStoreData(zipcode, page, sortBy, callback) {
    let term = "pet stores";
    return getDataFromYelp(term, zipcode, callback, page, sortBy)
        .catch(handleYelpError);
}

function generateButtonString(data, item, labels) {
    return `<button type="button" role="button" class="option js-option" data-option="option${labels.charAt(item)}">
                ${labels.charAt(item)}.  ${data.businesses[item].name}</button>`;
}

function generateBizInfoString(selected) {
    let label = "ABCD";
    let data = storesData;
    let item = selected.charAt(6) - 1;
    if (label.indexOf(selected.charAt(6)) >= 0) {
        data = vetsData;
        item = label.indexOf(selected.charAt(6));
    }
    return `<div class="biz-info"><button role="button" type="button" 
            class="close js-close" aria-label="Close" aria-pressed="false">X</button>
            <h2>${data.businesses[item].name}</h2>
            <img src = "${data.businesses[item].image_url}">
            <p>${data.businesses[item].location.display_address[0]}</p>
            <p>${data.businesses[item].display_phone}</p>
            </div>`;
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
    let labels = 'ABCD';
    vetsString.push(`<h2>Vets</h2>`);
    if (!vetsData || !vetsData.businesses || !vetsData.businesses.length) {
        vetsString.push(`<p>Sorry, no results</p>`);
        vetsString.join("");
        $('.js-vets-results').html(vetsString);
        $('.js-aria-vets-results').html(`<p>Sorry, no veterinarians found within 10 miles around ${zipcode}.</p>`);
        return data;
    }
    vetsString.push(`<p>Total results: ${data.total}</p><div class="options-wrapper">`);
    for (let i = 0; i < vetsData.businesses.length; i++) {
        vetsString.push(generateButtonString(vetsData, i, labels));
        vetsCoordinates.push(generateObjectWithCoordinates(vetsData, i));
    }
    vetsString.push(`</div>`);
    vetsString.push(generateNextPrevButtons("vets", page, data));
    vetsString.join("");
    $('.js-vets-results').html(vetsString);
    drawMarkers(vetsData, vetsCoordinates, labels);
    $('.js-aria-vets-results').html(`<p>${data.total} veterinarians found.</p>`);
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
        let averageLong = allLong.reduce((a, b) => a + b, 0) / (allLong.length);
        let averageLat = allLat.reduce((a, b) => a + b, 0) / (allLat.length);
        coordinate = {
            lng: averageLong,
            lat: averageLat
        }
    }
    if (map) {
        map.setCenter(coordinate);
    }
}

function generateOnlyNextButtonString(term, page) {
    return `<div class="js-button-wrapper button-wrapper">
            <button role="button" type="button" data-page="${page + 1}" data-term="${term}" 
            class="next-prev js-next">Next</button>
            </div><div class="js-${term}-loader loader button-wrapper" hidden></div>`;
}

function generateOnlyPrevButtonString(term,page) {
    return `<div class="js-button-wrapper button-wrapper"><button role="button" type="button" 
            data-page="${page - 1}" data-term="${term}" class="next-prev js-prev">Prev</button>
            </div><div class="js-${term}-loader loader button-wrapper" hidden></div>`;
}

function generatePrevAndNextButtonsString(term, page) {
    return `<div class="js-button-wrapper button-wrapper"><button role="button" type="button" data-page="${page - 1}" data-term="${term}" class="next-prev js-prev">Prev</button>
            <button role="button" type="button" data-page="${page + 1}" data-term="${term}" class="next-prev js-next">Next</button>
            </div><div class="js-${term}-loader loader button-wrapper" hidden></div>`;
}

function generateNextPrevButtons(term, page, data) {
    if (page===0 && data.total<=4) {
        return "";
    } else if (page === 0 && data.total > 4) {
        return generateOnlyNextButtonString(term, page);
    } else if (data.businesses.length === 4 && data.total / (page + 1) > 0) {
        return generatePrevAndNextButtonsString(term, page);
    } else {
        return generateOnlyPrevButtonString(term, page);
    }
}

function displayPetStoresResults(data, page) {
    storesData = data;
    let storesString = [];
    let labels = '1234';
    storesString.push(`<h2>Pet Stores</h2>`);
    if (!storesData || !storesData.businesses || !storesData.businesses.length) {
        storesString.push(`<p>Sorry, no results</p>`);
        storesString.join("");
        $('.js-pet-stores-results').html(storesString);
        $('.js-aria-stores-results').html(`<p>Sorry, no pet stores found within 10 miles around ${zipcode}.</p>`);
        return data;
    }
    storesString.push(`<p>Total results: ${data.total}</p><div class="options-wrapper">`);
    for (let i = 0; i < storesData.businesses.length; i++) {
        storesString.push(generateButtonString(storesData, i, labels));
        storesCoordinates.push(generateObjectWithCoordinates(storesData, i));
    }
    storesString.push(`</div>`);
    storesString.push(generateNextPrevButtons("stores", page, data));
    storesString.join("");
    $('.js-pet-stores-results').html(storesString);
    $('.js-aria-stores-results').html(`<p>${data.total} pet stores found.</p>`);
    drawMarkers(storesData, storesCoordinates, labels);
    return data;
}

function generateModalInfo(selected) {
    $('.js-info-window').html(generateBizInfoString(selected));
}

function handleOptions(event) {
    event.stopPropagation();
    let selected = $(event.currentTarget).attr('data-option');
    generateModalInfo(selected);
    toggleInfoWindow();
}

function toggleInfoWindow() {
    $('.js-info-window').toggleClass('show-info-window');
}

function watchOptions() {
    $('.js-vets-results, .js-pet-stores-results').on('click', '.js-option', handleOptions);
    $('.js-info-window').on('click', '.js-close', toggleInfoWindow);
    $('.js-vets-results, .js-pet-stores-results').on('click', '.js-prev, .js-next', handleNextPrevButton);
}

function handleNextPrevButton(event) {
    event.stopPropagation();
    let page = parseInt($(event.currentTarget).attr('data-page'));
    let term = $(event.currentTarget).attr('data-term');
    if (term === "vets") {
        $('.js-button-wrapper').hide();
        $('.js-vets-loader').show();
        deleteMarkers(vetsMarkers);
        vetsCoordinates = [];
        return getVetData(zipcode, page, sortBy)
            .then(vets => {
                vetsData = vets;
                if (vetsData.businesses.length || storesData.businesses.length) {
                    //if code reaches here, both requests have been succesful
                    setCenterOfMap(vetsData, storesData);
                    displayVetsResults(vetsData, page);
                    $('.js-vets-loader').hide();
                    $('.js-button-wrapper').show();
                }
            });
    } else {
        $('.js-button-wrapper').hide();
        $('.js-stores-loader').show();
        deleteMarkers(storesMarkers);
        storesCoordinates = [];
        return getPetStoreData(zipcode, page, sortBy)
            .then(petStores => {
                storesData = petStores;
                if (vetsData.businesses.length || storesData.businesses.length) {
                    //if code reaches here, both requests have been succesful
                    setCenterOfMap(vetsData, storesData);
                    displayPetStoresResults(storesData, page);
                    $('.js-stores-loader').hide();
                    $('.js-button-wrapper').show();
                }
            });
    }
}

function showAndHideElements() {
    $('.js-start img, legend, .js-start-loader').hide();
    $('.js-start').addClass('to-top invert-colors small').removeClass('to-middle big');
    $('.js-start button').addClass('light').removeClass('dark').show();
    $('#zip-code').val("");
    $('#sort-by').val("distance");
}

function reset() {
    $('.js-vets-results, .js-pet-stores-results, #map, .js-errors>p, .js-start button').hide();
    $('.js-start fieldset').addClass('clear');
    deleteMarkers(vetsMarkers);
    deleteMarkers(storesMarkers);
    vetsData = {};
    storesData = {};
    vetsCoordinates = [];
    storesCoordinates = [];
    zipcode = 0;
}

function handleSearch(event) {
    event.preventDefault();
    reset();
    $('.js-start-loader').show();
    let zipcodeInput = $('#zip-code');
    zipcode = zipcodeInput.val();
    
    let sortInput = $('#sort-by');
    sortBy = sortInput.val();
    
    let page = 0;
    return getPetStoreData(zipcode, page, sortBy)
        .then(petStores => {
            storesData = petStores;
            return getVetData(zipcode, page, sortBy)
                .then(vets => {
                    vetsData = vets;
                    displayPetStoresResults(storesData, page);
                    displayVetsResults(vetsData, page);
                    if (vetsData.businesses.length || storesData.businesses.length) {
                        setCenterOfMap(vets, petStores);
                        showAndHideElements();
                        $('.js-vets-results, .js-pet-stores-results, #map').removeClass('hide-it').show();
                    } else {
                        showAndHideElements();
                        $('.js-vets-results, .js-pet-stores-results').removeClass('hide-it').show();
                    }
                });
        });
}

function watchSubmitButton() {
    $('.js-form').on('submit', handleSearch);
}

function showStartPage() {
    $('.js-vets-results, .js-pet-stores-results, #map').hide();
    $('.js-start button').addClass('dark');
}

function main() {
    showStartPage();
    watchSubmitButton();
    watchOptions();
}

$(main);