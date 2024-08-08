module.exports = (defaultUser = {}, userId) => {
    const user = {
        id: userId || defaultUser['id']
    };

    //REQUEST -> user -> gender
    defaultUser['gender'] && (user['gender'] = defaultUser['gender']);

    //REQUEST -> user -> yob
    defaultUser['yob'] && (user['yob'] = defaultUser['yob']);

    //REQUEST -> user -> ext
    defaultUser['ext'] && defaultUser['ext']['consent'] !== undefined && (user['ext'] = {'consent': `${defaultUser['ext']['consent']}`});

    return user;
};