/**
 * Handles selection a complex action
 * @param {number} actionId 
 * @param {number*} actionListId 
 * @param {number} actionDetailId 
 * @param {string} actionType 
 * @param {string} mediaType 
 */
function selectCplxAction(actionId, actionListId, actionDetailId, actionType, mediaType) {
    /*console.log(
        "selectCplxAction: ActId: ", actionId, ", ",
        "ActListId: ", actionListId, ", ",
        "ActDelId: ", actionDetailId, ", ",
        "ActionType: ", actionType, ", ",
        "MediaType: ", mediaType
      );*/

    // url of the django endpoint
    //const url = 'http://127.0.0.1:8000/cab/loadcplxaction';
    const url = '/cab/loadcplxaction';

    // Send a post request to the django server
    fetch(url, {method: 'POST'})
    .then(response => response.json())
    .then(data => {
        
        if (data.hasOwnProperty("exception")) {
            throw new Error(`cannot uploadDbFile: ${data['exception']}`);
        }

        data = JSON.parse(data);

        // load the complex action html page in a new tab
        page = data['new_tab']
        page += "?actId=" + actionId;
        page += "&actLstId=" + actionListId;
        page += "&actDetId=" + actionDetailId;
        page += "&actTyp=" + actionType;
        page += "&medTyp=" + mediaType;
        //console.log(page);

        var strWindowFeatures = "location=yes,height=768,width=1366,scrollbars=yes,status=yes";
        window.open(page, '_blank', strWindowFeatures);
    })
    .catch(error => {
        // Handle errors here
        console.error(error);
    });
}