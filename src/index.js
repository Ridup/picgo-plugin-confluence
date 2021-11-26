// fork from : https://github.com/yuki-xin/picgo-plugin-web-uploader

// const logger = require('@varnxy/logger')
// logger.setDirectory('/Users/zhang/Work/WorkSpaces/WebWorkSpace/picgo-plugin-confluence/logs')
// let log = logger('plugin')

const {EnumAttachmentType} = require('./constant')
module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register('confluence', {
      handle,
      name: 'Confluence图床',
      config: config
    })
  }

  const handle = async function (ctx) {
    let userConfig = ctx.getConfig('picBed.confluence')
    if (!userConfig) {
      throw new Error('Can\'t find uploader config')
    }
    const url = userConfig.URL
    const group = userConfig.Group
    const project = userConfig.Project
    const token = userConfig.Token
    const realImgUrlPre = url + '/' + group + '/' + project
    const realUrl = url + '/api/v4/projects/' + group + '%2F' + project + '/uploads'

    try {
      let imgList = ctx.output
      for (let i in imgList) {
        let image = imgList[i].buffer
        if (!image && imgList[i].base64Image) {
          image = Buffer.from(imgList[i].base64Image, 'base64')
        }

        const postConfig = postOptions(realUrl, token, image, imgList[i].fileName)
        let body = await ctx.Request.request(postConfig)
        delete imgList[i].base64Image
        delete imgList[i].buffer
        body = JSON.parse(body)
        imgList[i]['imgUrl'] = realImgUrlPre + body['url']
      }
    } catch (err) {
      ctx.emit('notification', {
        title: '上传失败',
        body: JSON.stringify(err)
      })
    }
  }

  const postOptions = (url, token, image, fileName) => {
    let headers = {
      contentType: 'multipart/form-data',
      'User-Agent': 'PicGo',
      'PRIVATE-TOKEN': token
    }
    let formData = {
      'file': {
        'value': image,
        'options': {
          'filename': fileName
        }
      }
    }
    const opts = {
      method: 'POST',
      url: url,
      headers: headers,
      formData: formData
    }
    return opts
  }

  const config = ctx => {
    let userConfig = ctx.getConfig('picBed.confluence')
    if (!userConfig) {
      userConfig = {}
    }
    return [
      {
        name: 'confluenceBaseUrl',
        type: 'input',
        default: userConfig.confluenceBaseUrl,
        required: true,
        message: 'https://confluence.com',
        alias: 'Confluence网站地址'
      },
      {
        name: 'userName',
        type: 'input',
        default: userConfig.userName,
        required: true,
        message: 'User Name',
        alias: '用户名'
      },
      {
        name: 'userPassword',
        type: 'password',
        default: userConfig.userPassword,
        required: true,
        message: 'User Password',
        alias: '密码'
      },
      {
        name: 'attachmentType',
        type: 'list',
        choices: [{...EnumAttachmentType.FILE}, {...EnumAttachmentType.IMAGE}],
        default: userConfig.attachmentType,
        required: true,
        message: 'Attachment Type',
        alias: '附件类型'
      },
      {
        name: 'pageId',
        type: 'input',
        default: userConfig.pageId,
        required: true,
        message: 'Page Id',
        alias: '页面编号'
      }
    ]
  }
  return {
    uploader: 'confluence',
    transformer: 'confluence',
    config: config,
    register
  }
}
