/**
 * Upload a database file from client to server
 * @param {file} dbfile 
 */
function uploadDbFile(dbfile) {

    // remove and hide any currently shown trainnumbers and actions
    d3.select("#svgTnActions").selectAll("*").remove();
    d3.select("#divSelectCplx").attr("style", "visibility: hidden");
    d3.select("#divTnActions").attr("style", "visibility: hidden");
    d3.select("#divTrainNumbers").attr("style", "visibility: hidden");
    d3.select("#dlTrainNumbers").html("");

    //document.getElementById('lstrainnumbers').value = "";

    // url of the django endpoint
    //const url = 'http://127.0.0.1:8000/cab/uploaddb';
    const url = '/cab/uploaddb';

    // form the data (file) to send
    let data = new FormData()
    data.append('dbfile', dbfile)
    //console.log(data)

    // set cursor shape to 'progress' while loading
    document.body.style.cursor = "progress";

    // Send a post request to the django server
    fetch(url, {
        method: 'POST', 
        body: data 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Parse the response as JSON
    })
    .then(data => {
        data = JSON.parse(data);

        if (data.hasOwnProperty("exception")) {
            throw new Error(`cannot uploadDbFile: ${data['exception']}`);
        }
        // loaded: set cursor shape to 'auto' back
        document.body.style.cursor = "auto";

        // handle received train numbers
        gotTrainNumbers(data);
    })
    .catch(error => {
        // Handle errors here
        document.body.style.cursor = "auto";
        console.error(error);
        alert(error);
    });
}


/**
 * main: entry point of the cab.html page
 */
function main() {
    
    my_select = d3.select("#inDbFile")

    const currentUrl = window.location.href;
    console.log(currentUrl);

    my_select.on("change", (event) => {
      //console.log(event);
      if (event.target.files[0]) {
        //console.log(event.target.files[0].name);
        uploadDbFile(event.target.files[0]);
      }
    });
  }
