const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Cryptr = require('cryptr');


class Auth {
  constructor(crud) {
    this.crud = crud;
    this.table = 'User';
  }

  signToken = (user) => {
    let token = jwt.sign({ user }, process.env.TOKEN_SECRET, {
      expiresIn: 3 * 24 * 3600
    });

    const cryptr = new Cryptr(process.env.TOKEN_SECRET);

    token = cryptr.encrypt(token);
    return token;

  };

  signup = async (req, res) => {
    try {
      const { email, password, confirmPassword } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Please provide email and password" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, error: "Password and confirmPassword not match" });
      }

      req.body.password = await bcrypt.hash(password, 12);
      req.body.role = "loggedIn";

      const data = { email };

      let result = await this.crud.read(this.table, data);

      if (!result.data) {
        result = await this.crud.create(this.table, req.body);
      } else {
        return res.status(400).json({ success: false, error: "User Already Exit" });
      }

      if (result.status !== 200 && result.status !== 201) {
        return res.status(result.status).json({ success: false, data: result.error });
      }

      const token = this.signToken(result.data);

      result.data.password = undefined;
      result.data.role = undefined;

      res.status(result.status).json({ success: true, token: token, data: result.data });

    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  };

  signin = async (req, res) => {
    try {
      const { emu, password } = req.body;

      if (!emu || !password) {
        return res.status(400).json({ success: false, error: "Please provide credentials" });
      }

      // eslint-disable-next-line
      const mobileRegex = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]{8,14}$/g;
      // eslint-disable-next-line
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

      let result;
      if (emailRegex.test(emu)) {
        console.log("Email Match+++++++++++++");
        result = await this.crud.read(this.table, { email: emu, archive: false });
      } else if (mobileRegex.test(emu)) {
        console.log("Mobile Number Match+++++++++++++");
        result = await this.crud.read(this.table, { mobileNo: emu, archive: false });
      } else {
        console.log("username Match +++++++++++++");
        result = await this.crud.read(this.table, { username: emu, archive: false });
      }

      if (result.status !== 200) {
        return res.status(result.status).json({ success: false, error: "Invalid credentials" });
      }


      const comparePassword = await bcrypt.compare(password, result.data[0].password);
      if (!comparePassword) {
        return res.status(result.status).json({ success: false, error: "Invalid credentials" });
      }

      result.data = result.data[0];

      const token = this.signToken(result.data);

      result.data.password = undefined;
      result.data.role = undefined;

      // console.log(result);

      res.status(200).json({ success: true, token: token, data: result.data });

    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  };
}

module.exports = Auth;