const { _ } = require("lodash");

const childInclude = (db, path, table) => {
    const modelJson = require(path + table);

    if (_.isEmpty(modelJson.relations?.hasMany) && _.isEmpty(modelJson.relations?.hasOne) && _.isEmpty(modelJson.relations?.belongsTo)) {
        return [];
    }

    let include = [];

    // fetch relationship table data
    modelJson?.relations?.hasMany?.map(item => {
        include.push({ model: db.model(item.table), as: item.as, include: childInclude(db, path, item.table) });
    });
    modelJson?.relations?.hasOne?.map(item => {
        include.push({ model: db.model(item.table), as: item.as, include: childInclude(db, path, item.table) });
        console.log(item.table);
    });

    return include;
};

const parentInclude = (db, path, table) => {
    const modelJson = require(path + table);

    if (_.isEmpty(modelJson.relations?.belongsTo)) {
        return [];
    }

    let include = [];

    // fetch relationship table data
    modelJson?.relations?.belongsTo?.map(item => {
        include.push({ model: db.model(item.table), as: item.as });
    });
    return include;
};



module.exports = { childInclude, parentInclude };