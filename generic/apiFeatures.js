const { Op } = require('sequelize');
const pagination = (pageNum, pageLimit) => {
    const pageNumber = Number.parseInt(pageNum);
    const recordsPerPage = Number.parseInt(pageLimit);

    let page = 1;
    if (!Number.isNaN(pageNumber) && pageNumber > 1) {
        page = pageNumber;
    }

    let limit = 10;
    if (
        !Number.isNaN(recordsPerPage) &&
        recordsPerPage > 0 &&
        recordsPerPage < 1000
    ) {
        limit = recordsPerPage;
    }

    const offset = (page - 1) * limit;

    return { offset, limit };
};

const orderBy = (order) => {
    return [order.split(",")];
};

const filterBy = (query) => {


    const excludedFields = ['isInclude', 'page', 'size', 'order'];

    excludedFields.forEach(el => delete query[el]);

    const queryObj = {};

    Object.keys(query).forEach((key) => {
        const objKey = key;
        const objValue = query[key];
        const basicOp = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'];
        const mediumOp = ['like', 'notLike', 'iLike', 'notILike', 'startWith', 'endsWith', 'substring', 'regexp', 'notRegexp', 'iRegexp', 'notIRegexp'];

        if (Object.keys(objValue).length === 1) {
            for (const key in objValue) {
                if (basicOp.includes(key)) {
                    queryObj[objKey] = { [Op[key]]: objValue[key] };
                } else if (mediumOp.includes(key)) {
                    queryObj[objKey] = { [Op[key]]: objValue[key] };
                } else if (key === 'between' || key === 'notBetween') {
                    queryObj[objKey] = { [Op[key]]: objValue[key].split(',') };
                } else if (key === 'in' || key === 'notIn') {
                    queryObj[objKey] = { [Op[key]]: (objValue[key].split(',')) };
                } else {
                    queryObj[objKey] = { [Op['eq']]: objValue[key] };
                }
            }
        } else {
            let andArray = [];
            for (const key in objValue) {
                if (basicOp.includes(key)) {
                    let obj = {};
                    if (basicOp.includes(key)) {
                        obj[objKey] = { [Op[key]]: objValue[key] };
                    }
                    andArray.push(obj);
                    queryObj[Op.and] = andArray;
                }
            }

        }

    });

    return queryObj;
};




module.exports = { pagination, orderBy, filterBy };
