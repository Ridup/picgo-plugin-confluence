/**
 * Confluence图床
 *
 * @author riodup
 * @since 2021/11/29 14:07
 */

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
    const {log} = ctx
    let userConfig = ctx.getConfig('picBed.confluence')
    if (!userConfig) {
      throw new Error('Can\'t find uploader config')
    }
    log.warn('userConfig:', JSON.stringify(userConfig))
    const confluenceBaseUrl = userConfig.confluenceBaseUrl
    // const userName = userConfig.userName
    // const userPassword = userConfig.userPassword
    // const attachmentType = userConfig.attachmentType
    const pageId = userConfig.pageId

    const realUrl = confluenceBaseUrl + '/rest/api/content/' + pageId + '/child/attachment'

    try {
      let imgList = ctx.output || []
      for (let i in imgList) {
        let image = imgList[i].buffer
        log.warn('imgList[i].buffer:', JSON.stringify(imgList[i].buffer))
        log.warn('imgList[i].base64Image:', JSON.stringify(imgList[i].base64Image))
        log.warn('imgList[i].fileName:', JSON.stringify(imgList[i].fileName))
        if (!image && imgList[i].base64Image) {
          image = Buffer.from(imgList[i].base64Image, 'base64')
        }

        const request = buildRequest(realUrl, image, imgList[i].fileName)
        // let body = await ctx.request(request)
        const res = await ctx.request(request)
        log.warn('res:', JSON.stringify(res))
        if (!res.statusCode) {
          const body = res || {}
          const {results} = body || {}
          const {_links} = (results && results[0]) || {}
          const {download} = _links || {}
          log.warn('download:', JSON.stringify(download))
          imgList[i]['imgUrl'] = `${confluenceBaseUrl}${download || ''}`
        } else {
          log.error('err:', JSON.stringify(res))
          ctx.emit('notification', {
            title: '上传失败',
            body: res && res.message
          })
          // POST failed...
        }
        // delete imgList[i].base64Image
        // delete imgList[i].buffer
        // log.warn('body:', JSON.stringify(body))
        // body = JSON.parse(body) || {}
        // imgList[i]['imgUrl'] = body['url']
      }
    } catch (err) {
      ctx.emit('notification', {
        title: '上传失败',
        body: JSON.stringify(err)
      })
    }
  }

  const buildRequest = (url, image, fileName) => {
    let headers = {
      contentType: 'multipart/form-data',
      'X-Atlassian-Token': 'nocheck',
      'Authorization': 'Basic =='
    }
    let formData = {
      file: {
        value: image,
        options: {
          filename: fileName
        }
      },
      comment: `From PicGo -${new Date().toLocaleDateString()}`
    }
    return {
      method: 'POST',
      json: true,
      uri: url,
      headers: headers,
      formData: formData
    }
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
