const axios = require('axios');

let accessToken = null;
let tokenExpireTime = null;

/**
 * 获取微信Access Token
 * @returns {Promise<string>} Access Token
 */
async function getAccessToken() {
  try {
    if (accessToken && tokenExpireTime && Date.now() < tokenExpireTime) {
      return accessToken;
    }

    const response = await axios.get(process.env.WECHAT_ACCESS_TOKEN_URL, {
      params: {
        grant_type: 'client_credential',
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET
      }
    });

    accessToken = response.data.access_token;
    tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;

    return accessToken;
  } catch (error) {
    console.error('Get access token error:', error);
    throw new Error('Failed to get access token');
  }
}

/**
 * 获取用户OpenID
 * @param {string} code - 微信小程序登录code
 * @returns {Promise<string>} OpenID
 */
async function getOpenid(code) {
  try {
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    if (response.data.errcode) {
      throw new Error(response.data.errmsg);
    }

    return response.data.openid;
  } catch (error) {
    console.error('Get openid error:', error);
    throw new Error('Failed to get openid');
  }
}

/**
 * 发送订阅消息
 * @param {string} openid - 用户OpenID
 * @param {string} templateId - 模板ID
 * @param {Object} data - 模板数据
 * @param {string} page - 跳转页面
 * @returns {Promise<Object>} 发送结果
 */
async function sendSubscribeMessage(openid, templateId, data, page = '') {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(process.env.WECHAT_TEMPLATE_MESSAGE_URL, {
      touser: openid,
      template_id: templateId,
      page,
      data
    }, {
      params: {
        access_token: accessToken
      }
    });

    if (response.data.errcode !== 0) {
      console.error('Send message error:', response.data);
      return { success: false, error: response.data.errmsg };
    }

    return { success: true };
  } catch (error) {
    console.error('Send subscribe message error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAccessToken,
  getOpenid,
  sendSubscribeMessage
};
