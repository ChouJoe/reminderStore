const { DataTypes } = require('sequelize');

/**
 * 定义User模型
 * @param {Sequelize} sequelize - Sequelize实例
 * @returns {Model} User模型
 */
function defineUserModel(sequelize) {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.STRING(255),
      primaryKey: true
    },
    openid: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    nickname: {
      type: DataTypes.STRING(255),
      defaultValue: ''
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      defaultValue: ''
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeUpdate: (user) => {
        user.updatedAt = new Date();
      }
    }
  });

  return User;
}

module.exports = defineUserModel;
