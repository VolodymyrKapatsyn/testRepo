module.exports = (eventsList, event_data) => {
    if(!eventsList) {
        eventsList = {
            data: [],
            count: 0
        };
    }

    if( eventsList.count < 10) {
        eventsList.data.push(event_data);
        eventsList.count ++;
    }

    return eventsList
}