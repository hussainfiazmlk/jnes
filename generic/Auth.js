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

      // six digit email verification code
      const emailcode = Math.floor(100000 + Math.random() * 900000);

      req.body.password = await bcrypt.hash(password, 12);
      req.body.role = "loggedIn";
      req.body.emailVerificationCode = emailcode;

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

      res.status(result.status).json({ success: true, data: "Register successfully! Please Verify your email" });

    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  };

  verifyEmail = async (req, res) => {
    try {
      let data = { email: req.body.email };

      const result = await this.crud.read(this.table, data);

      if (result.status !== 200) {
        return res.status(result.status).json({ success: false, error: "Invalid Email" });
      }

      const verifyCode = req.body.verifyCode;

      if (!verifyCode) {
        return res.status(400).json({ success: false, error: "Please Provide verification code" });
      }

      if (verifyCode !== result.data[0].emailVerificationCode) {
        return res.status(400).json({ success: false, error: "Invalid Verification code" });
      }

      console.log(result.data[0].emailVerificationCode);
      const id = result.data[0].id;

      data = { emailVerificationCode: null };
      await this.crud.update(this.table, data, id);

      result.data[0].emailVerificationCode = undefined;

      const token = this.signToken(result.data[0]);

      result.data.password = undefined;
      result.data.role = undefined;

      res.status(200).json({ success: true, token: token, data: result.data });

    } catch (error) {
      console.log(error);
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

      if (result.data[0].emailVerificationCode) {
        return res.status(401).json({ success: false, error: 'Please Verify your email to login' });
      }

      const comparePassword = await bcrypt.compare(password, result.data[0].password);
      if (!comparePassword) {
        return res.status(result.status).json({ success: false, error: "Invalid credentials" });
      }

      result.data = result.data[0];

      const token = this.signToken(result.data);

      result.data.password = undefined;
      result.data.role = undefined;
      result.data.emailVerificationCode = undefined;

      res.status(200).json({ success: true, token: token, data: result.data });

    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  };

  authenticate_token = async (req, res, next) => {
    try {
      // public access
      if (req.method === 'GET') {
        const modelPath = process.cwd() + /models/;
        console.log(modelPath);
        let table = req.params.table;
        let modelJson = require(modelPath + table);
        (modelJson.isPublic) && next();
      } else {
        // 1) Getting token and check it's there
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
          token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
          return res.status(401).json({ success: false, error: 'unauthorized' });
        }

        // 2) Verification token
        const cryptr = new Cryptr(process.env.TOKEN_SECRET);
        const decoded = jwt.verify(cryptr.decrypt(token), process.env.TOKEN_SECRET);

        // 3) Check if user still exists
        const currentUser = await this.crud.read(this.table, { id: decoded.user.id });
        if (!currentUser) {
          return res.status(401).json({ success: false, error: 'unauthorized' });
        }

        // 4) Check if user verify their email address
        if (currentUser.data[0].emailVerificationCode) {
          return res.status(401).json({ success: false, error: 'Please Verify your email to Process Further' });
        }

        // 4) Check if user changed password after the token was issued
        if (decoded.user.password !== currentUser.data[0].password) {
          return res.status(401).json({ success: false, error: 'unauthorized' });
        }

        req.user = decoded.user;
        next();
      }
    } catch (error) {
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }
  };

  updatePassword = async (req, res) => {
    try {
      let { currentPassword, newPassword, confirmPassword } = req.body;
      // Get Current User
      const user = req.user;

      // Check if provided current password is correct
      const comparePassword = await bcrypt.compare(currentPassword, user[0].password);
      if (!comparePassword) {
        return res.status(400).json({ success: false, error: "Current Password is not correct" });
      }

      // Check newPassowrd and confirmPassword match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, error: "newPassword and confirmPassword not match" });
      }

      // Update Password
      newPassword = await bcrypt.hash(newPassword, 12);
      const id = user[0].id;
      const data = { password: newPassword };
      console.log(id, data);
      const result = await this.crud.update(this.table, data, id);

      if (result.status !== 200) {
        return res.status(result.status).json({ success: false, error: result.error });
      }


      res.status(result.status).json({ success: true, data: "Password Changed Successfully! Please login again" });
    } catch (error) {
      console.log(error);
      res.status(400).json({ success: false, error: error });
    }
  };

  resetPassword = async (req, res) => {
    try {
      const { step, eorm, resetCode } = req.body;


      // eslint-disable-next-line
      const mobileRegex = /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]{8,14}$/g;
      // eslint-disable-next-line
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

      let user;
      if (emailRegex.test(eorm)) {
        console.log("Email Match+++++++++++++");
        user = await this.crud.read(this.table, { email: eorm, archive: false });
      } else if (mobileRegex.test(eorm)) {
        console.log("Mobile Number Match+++++++++++++");
        user = await this.crud.read(this.table, { mobileNo: eorm, archive: false });
      }

      if (user.status !== 200) {
        return res.status(user.status).json({ success: false, error: "No account is associated email or Mobile Number" });
      }

      if (step === 1) {
        // 6 digit random code generator
        let reset_code = Math.floor(100000 + Math.random() * 900000);
        const data = { resetCode: reset_code };
        const id = user.data[0].id;

        const result = await this.crud.update(this.table, data, id);

        if (result.status !== 200) {
          return res.status(result.status).json({ success: false, error: 'Unable to send OTP' });
        }

        return res.status(result.status).json({ success: true, data: "OTP Send! Please verify it" });
      }

      if (step === 2) {
        const data = { resetCode, id: user.data[0].id };

        const result = await this.crud.read(this.table, data);

        if (result.status !== 200) {
          return res.status(result.status).send({ success: false, error: 'OTP code is not correct' });
        }

        return res.status(result.status).json({ success: true, data: "OTP Verified! Please reset Your Password" });
      }

      if (step === 3) {
        let data = { resetCode, id: user.data[0].id };

        let result = await this.crud.read(this.table, data);

        if (result.status !== 200) {
          return res.status(result.status).send({ success: false, error: 'OTP code is not correct' });
        }

        let password = req.body.password;
        if (!password) {
          return res.status(result.status).send({ success: false, error: 'Please enter new passsword' });
        }

        password = await bcrypt.hash(password, 12);

        data = { resetCode: null, password };
        const id = user.data[0].id;

        result = await this.crud.update(this.table, data, id);

        if (result.status !== 200) {
          return res.status(result.status).json({ success: false, error: 'Unable to Reset Password' });
        }

        return res.status(result.status).json({ success: true, data: "Password Reset Successfully" });
      }

    } catch (error) {
      res.status(400).json({ success: false, error: error });
    }
  };

}

module.exports = Auth;