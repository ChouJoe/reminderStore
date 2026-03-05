const express = require('express');
const router = express.Router();

/**
 * 获取User模型
 * 从app.locals中获取sequelize实例
 */
function getUserModel(req) {
  return req.app.locals.sequelize.models.User;
}

/**
 * 用户登录/注册
 * 基于微信小程序code获取openid，自动创建新用户
 */
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const wechatService = require('../services/wechatService');
    const openid = await wechatService.getOpenid(code);

    const User = getUserModel(req);

    let user = await User.findOne({ where: { openid } });

    if (!user) {
      // 使用openid作为用户ID
      user = await User.create({ 
        id: openid,
        openid 
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * 更新用户信息
 * 更新用户昵称和头像
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { nickname, avatarUrl } = req.body;

    const User = getUserModel(req);

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ nickname, avatarUrl });

    res.json({
      success: true,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Update user failed' });
  }
});

/**
 * 获取用户信息
 * 根据用户ID获取详细信息
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const User = getUserModel(req);

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Get user failed' });
  }
});

/**
 * 批量获取用户信息
 * 根据用户ID列表获取多个用户信息
 */
router.post('/batch', async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds must be an array' });
    }

    const User = getUserModel(req);

    const users = await User.findAll({
      where: {
        id: userIds
      }
    });

    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl
      }))
    });
  } catch (error) {
    console.error('Batch get users error:', error);
    res.status(500).json({ error: 'Batch get users failed' });
  }
});

module.exports = router;
