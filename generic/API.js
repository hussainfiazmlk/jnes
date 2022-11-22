class API {
  constructor(crud) {
    this.crud = crud;
  }

  create = async (req, res) => {
    try {
      const { table } = req.params;
      const data = req.body;

      if (table == 'User') {
        return res.status(400).json({ success: false, error: "you don't have permision to create user" });
      }

      const result = await this.crud.create(table, data);

      if (result.status !== 201) {
        return res.status(result.status).json({ success: false, data: result.error });
      }

      res.status(result.status).json({ success: true, data: result.data });
    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  };

  read = async (req, res) => {
    try {
      const { table, id } = req.params;
      const { isInclude, page, size, order, ...query } = req.query;

      let data = { archive: false };
      if (id) data = { id };

      const result = await this.crud.read(table, data, isInclude, page, size, order, query);


      if (result.status !== 200) {
        return res.status(result.status).json({ success: false, error: result.error });
      }

      res.status(result.status).json({ success: true, totalPages: result.totalPages, totalRecordsInDB: result.totalRecordsInDB, totalRecord: result.totalRecord, data: result.data });
    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  };

  update = async (req, res) => {
    try {
      const { table, id } = req.params;
      const method = req.method;
      let data = req.body;

      const result = await this.crud.update(table, data, id, method);

      if (result.status !== 204 && result.status !== 200) {
        return res.status(result.status).json({ success: false, error: result.error });
      }

      if (result.status === 204) {
        return res.status(result.status).json({ success: true, data: null });
      }

      res.status(result.status).json({ success: true, data: result.data });
    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  };

  delete = async (req, res) => {
    try {
      const { table, id } = req.params;

      const result = await this.crud.delete(table, id);

      if (result.status !== 204) {
        return res.status(result.status).json({ success: false, error: result.error });
      }

      res.status(result.status).json({ success: true, data: null });
    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  };
}

module.exports = API;