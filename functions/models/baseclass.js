const firebaseAdmin = require('firebase-admin');

const {
  URLSearchParams
} = require('url');

class LocalInstance {
  async init() {
    this.db = firebaseAdmin.firestore();

    let configQuery = await this.db.doc('/configuration/private').get();
    let publicQuery = await this.db.doc('/configuration/public').get();
    this.privateConfig = {};
    if (configQuery.exists)
      this.privateConfig = configQuery.data();
    this.publicConfig = {};
    if (publicQuery.exists)
      this.publicConfig = publicQuery.data();

    return;
  }
  validateAdminToken(token) {
    let adminToken = this.privateConfig.adminToken;
    if (!token) return false;
    return (adminToken === token);
  }
}

module.exports = class BaseClass {
  static newLocalInstance() {
    return new LocalInstance();
  }
  static isNumeric(v) {
    if (v === undefined)
      return false;
    if (v === '')
      return false;
    return !isNaN(parseFloat(Number(v))) && isFinite(Number(v));
  }
  static getNumberOrDefault(str, d) {
    if (this.isNumeric(str))
      return Number(str);
    return d;
  }
  static path(obj, is, value) {
    try {
      if (!obj)
        return '';
      if (typeof is === 'string')
        return this.path(obj, is.split('.'), value);
      else if (is.length === 1 && value !== undefined)
        return obj[is[0]] = value;
      else if (is.length === 0)
        return obj;
      else if (!obj[is[0]])
        return '';
      else {
        return this.path(obj[is[0]], is.slice(1), value);
      }
    } catch (e) {
      console.log('path() err', e);
      return '';
    }
  }
  static async uidForEmail(email) {
    try {
      let userRecord = await firebaseAdmin.auth().getUserByEmail(email);
      return {
        uid: userRecord.uid,
        success: true
      }
    } catch (error) {
      return {
        sucess: false,
        error,
        errorMessage: 'uid not found for email ' + email
      }
    }
  }
  static async validateCredentials(firebaseusertoken) {
    let decodedToken = null;
    try {
      decodedToken = await firebaseAdmin.auth().verifyIdToken(firebaseusertoken);
    } catch (errObject) {
      return {
        errorMessage: 'Failed to verify firebase user token',
        errObject,
        success: false
      };
    }
    let email = decodedToken.email;
    let uid = decodedToken.uid;

    return {
      success: true,
      email,
      uid
    };
  }
  static async respondError(res, errorMessage, errorObject = null) {
    let err = new Error();
    //log errors here if wanted later
    return res.status(200).send({
      success: false,
      errorMessage,
      errorObject,
      stack: err.stack
    });
  }
  static isoToLocal(startTimeISOString) {
    let startTime = new Date(startTimeISOString);
    let offset = startTime.getTimezoneOffset();
    if (!offset)
      offset = 300;
    return new Date(startTime.getTime() - (offset * 60000));
  }
  static escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      } [tag]));
  }
}
