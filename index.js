const rescue_org_url = "https://api.rescuegroups.org/http/";
const yelp_url = "https://api.yelp.com/v3/businesses/search";
const cors_url = "https://cors-anywhere.herokuapp.com/";
const yelp_key = "SWqIeR03-4XLVB2rjSFheWjyG83SJbP_2TlwQGQF1AJhCq77pgSLmihlbN6TDYNg5ErnOPjjRs2YrRLeqx_riAQDuUXQdOb-pcv-ktebeXRa_BT3Wf7gNaS5j_teW3Yx";


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

function displayVetsResults(vetsData) {
    let vetsString = [];
    for(let i=0; i<= vetsData.businesses.length-1; i++) {
        vetsString.push(generateString(vetsData, i));
    }
    vetsString.join("");
    $('.js-vets-results').html(vetsString);
}

function displayPetStoresResults(storesData) {
    let storesString = [];
    for (let i = 0; i<= storesData.businesses.length-1; i++) {
        storesString.push(generateString(storesData, i));
    }
    storesString.join("");
    $('.js-pet-stores-results').html(storesString);
}

function handleErrors(xhr, status, error) {
    console.log('error ' + error);
}

// function getDataFromRescueOrg(animal, callback) {
//     var search = {
//         "apikey": "4ce69ee078d7f0d73ae36e0402eb6b34",
//         "objectType": "animals",
//         "objectAction": "publicSearch",
//         "search": {
//             "calcFoundRows": "Yes",
//             "resultStart": 0,
//             "resultLimit": 0,
//             "fields": ["animalName"],
//             "filters": [{
//                 "fieldName": "animalStatus",
//                 "operation": "equals",
//                 "criteria": "Adopted"
//             }, {
//                 "fieldName": "animalOrgID",
//                 "operation": "equals",
//                 "criteria": "****"
//             }]
//         }
//     };
//     var encoded = $.toJSON(search)
//     const settings = {
//         url: "https://api.rescuegroups.org/http/json/?data=" + encoded,
//         dataType: "jsonp",
//         success: callback,
//         //error: handleErrors,
//     }
//     $.ajax(settings);
// }

// function displayResults(data) {
//     $('.js-search-results').html(`<p>${data}</p>`);
//     console.log(data);
// }



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