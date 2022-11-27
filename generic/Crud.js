const { Sequelize } = require("sequelize");
const fs = require("fs");
const { childInclude, parentInclude } = require('./relationInclude');
const { pagination, orderBy, filterBy } = require("./apiFeatures");

class Crud {
    constructor() {
        // DB Connection
        this.db = new Sequelize(process.env.DB, process.env.DB_USER, process.env.PASSWORD, {
            host: process.env.HOST,
            dialect: process.env.DIALECT,
            logging: false,
        });

        // fetch models folder 
        this.path = process.cwd() + /models/;

        // create tables and tables relations
        syncModelsWithDB(this.db, this.path);
    }

    create = async (table, data) => {
        try {
            const model = this.db.model(table);

            // create new record
            const result = await model.create(data, { whereisNewRecord: true });

            const modelJson = require(this.path + table);

            // create new record in foreign table
            if (modelJson?.relations?.hasMany || modelJson?.relations?.hasOne) {
                Object.entries(modelJson.relations).forEach(([key, value]) => key != "belongsTo" && value.map((item) => {
                    const refrencedModelJson = require(this.path + item.table);
                    let refrencedColumn = refrencedModelJson.relations?.belongsTo?.map((item) => item.table === table && item.foreignKey);
                    data[item.as]?.map(async (refrencedTableData) => {
                        refrencedTableData[refrencedColumn] = result.id;
                        const model = this.db.model(item.table);
                        await model.create(refrencedTableData, { whereisNewRecord: true });
                    }
                    );
                }));
            }

            if (!result) {
                return { status: 400, error: `${table} not created` };
            }

            return { status: 201, data: result };
        } catch (error) {
            return { status: 400, error: error };
        }
    };

    read = async (table, data, isInclude, page, size, order, query) => {
        try {
            const model = this.db.model(table);

            // get relationship table data
            let include;
            if (isInclude == 'parent') {
                include = parentInclude(this.db, this.path, table);
            } else if (isInclude == 'no') {
                include = undefined;
            } else {
                include = childInclude(this.db, this.path, table);
            }

            const filter = query ? filterBy(query) : undefined;
            const filterData = { ...data, ...filter };
            const { offset, limit } = pagination(page, size);
            order = order ? orderBy(order) : undefined;

            const result = await model.findAll({ include, where: filterData, offset, limit, order });
            const totalRecords = await model.count({ where: data });

            if (!result || totalRecords === 0) return { status: 400, error: `${table} not found` };

            return { status: 200, totalPages: Math.ceil(totalRecords / limit), totalRecordsInDB: totalRecords, totalRecord: result.length, data: result };
        } catch (error) {
            return { status: 400, error: error };
        }
    };

    update = async (table, data, id, method) => {
        try {
            if (method === 'DELETE') {
                data = { archive: true };
            }

            const model = this.db.model(table);

            const result = await model.update(data, { where: { id: id } });

            const modelJson = require(this.path + table);

            // update reference table data if data provided
            if (result[0] !== 0) {
                if (modelJson?.relations?.hasMany || modelJson?.relations?.hasOne) {
                    Object.entries(modelJson.relations).forEach(([key, value]) => key != 'belongsTo' && value.map(async (item) => {
                        const refrencedModelJson = require(this.path + item.table);
                        let refrencedColumn = refrencedModelJson.relations?.belongsTo?.map((item) => item.table === table && item.foreignKey);
                        if (method === 'DELETE') {
                            const refrencedTableData = { archive: true };
                            refrencedColumn = refrencedColumn[0];
                            const data = {};
                            data[refrencedColumn] = +id;
                            const model = this.db.model(item.table);
                            await model.update(refrencedTableData, { where: data });
                        } else {
                            data[item.as]?.map(async (refrencedTableData) => {
                                refrencedTableData[refrencedColumn] = +id;
                                const data = {};
                                data[refrencedColumn] = +id;
                                const model = this.db.model(item.table);
                                await model.update(refrencedTableData, { where: data });
                            });
                        }
                    }));
                }
            }
            if (!result[0]) return { status: 400, error: `${table} with the id ${id} was not found` };

            if (method === 'DELETE') return { status: 204 };

            return { status: 200, data: result[0] };
        } catch (error) {
            return { status: 400, error: error };
        }
    };

    delete = async (table, id) => {
        try {
            const modelJson = require(this.path + table);

            // delete reference table data
            if (modelJson?.relations?.hasMany || modelJson?.relations?.hasOne) {
                Object.entries(modelJson.relations).forEach(([key, value]) => key != 'belongsTo' && value.map(async item => {
                    const refrencedModelJson = require(this.path + item.table);
                    let refrencedColumn = refrencedModelJson.relations?.belongsTo?.map((item) => item.table === table && item.foreignKey);
                    const data = {};
                    data[refrencedColumn] = +id;
                    const model = this.db.model(item.table);
                    await model.destroy({ where: data });
                }));
            }

            const model = this.db.model(table);

            const result = await model.destroy({ where: { id: id } });
            if (!result) return { status: 400, error: `${table} with the id ${id} was not found` };

            return { status: 204 };
        } catch (error) {
            return { status: 400, error: error };
        }
    };
}

const syncModelsWithDB = (db, path) => {
    try {
        fs.readdir(path, async (err, files) => {
            if (!err) {
                files.forEach(async (file) => {
                    const modelJson = require(path + file);
                    const modelName = file.split(".")[0];

                    // create table
                    await db.define(modelName, modelJson.definition, { tableName: modelName });

                    // create belongsTo relation
                    await modelJson.relations?.belongsTo?.map((item) => db.model(modelName).belongsTo(db.model(item.table), { foreignKey: item.foreignKey }));
                    // create hasMany relation
                    await modelJson.relations?.hasMany?.map((item) => db.model(modelName).hasMany(db.model(item.table), { foreignKey: item.foreignKey, as: item.as }));
                });

                // sync db with models
                if (process.env.NODE_ENV === "development") {
                    console.log("inside dev");
                    // await db.sync();
                    await db.sync({ alter: true }); // { force: true }, { alter: true }
                    console.log("models synced with database");
                } else {
                    console.log("inside pro");
                    await db.sync();
                    console.log("models synced with database");
                }
            }
        });
    } catch (error) {
        console.error("unabled to sync models with database: ", error);
    }
};


module.exports = Crud;
