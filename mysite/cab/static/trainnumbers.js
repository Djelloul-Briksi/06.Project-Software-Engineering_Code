/**
 * Get actions of the given train number id from the database
 * @param {number} trainNumberId 
 */
function getActions(trainNumberId) {

    // url of the django endpoint
    //const url = 'http://127.0.0.1:8000/cab/getactions';
    const url = '/cab/getactions';

    // form the data (file) to send
    const data = {
        'trainNumberId': trainNumberId
    };

    // Send a post request to the django server
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // Convert the data to a JSON string
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Parse the response as JSON
    })
    .then(data => {
        //console.log(data)
        data = JSON.parse(data);

        if (data.hasOwnProperty("exception")) {
            throw new Error(`cannot uploadDbFile: ${data['exception']}`);
        }

        gotActions(data)
    })
    .catch(error => {
        // Handle errors here
        console.error(error);
    });
}


/**
 * Handles selecting a train number
 * @param {text} trainNumber - selected train number
 */
function selectTrainNumber(trainNumber) {
    //console.log("selectTrainNumber: ", trainNumber)

    // remove and hide any currently shown actions
    d3.select("#svgTnActions").selectAll("*").remove();
    d3.select("#divSelectCplx")
        .attr("style", "visibility: hidder");
    d3.select("#divtntree")
        .attr("style", "visibility: hidden");

    // get train number actions
    const trainNumberId = trainNumber.substring( trainNumber.indexOf("(Id=") + 4, trainNumber.lastIndexOf(")"));
    //console.log("trainNumberId: ", trainNumber)
    getActions(trainNumberId);
  }

/**
 * Handles receiving train numbers
 * @param {json} data 
 */
function gotTrainNumbers(data) {
    //console.log("gotTrainNumbers: ", data);

    // fill-in datalist with train numbers
    const trainnumbers = d3.select("#dlTrainNumbers")
    data.forEach( function(item){
        value = "'" + item.trainNumberShortName + "' (Id=" + item.trainNumberId + ")";
        trainnumbers.append("option")
        .attr("className", item.trainNumberId)
        .attr("value", value);
    });

    const tn_field = d3.select("#divTrainNumbers")
        .attr("style", "visibility: visible");

    const input_trainnumbers = d3.select("#inTrainNumbers");
    //console.log(list_trainnumbers);
    input_trainnumbers.on("change", (event) => {
        //console.log(event);
        selectTrainNumber(event.target.value);
        });
}