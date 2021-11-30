/**
 * Confluence图床
 *
 * @author ridup
 * @since 2021/11/29 14:07
 */

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
    const userConfig = ctx.getConfig('picBed.confluence')
    if (!userConfig) {
      throw new Error('Can\'t find uploader config')
    }
    const confluenceBaseUrl = userConfig.confluenceBaseUrl
    const pageId = userConfig.pageId
    const realUrl = confluenceBaseUrl + '/rest/api/content/' + pageId + '/child/attachment'

    try {
      const imgList = ctx.output || []
      for (const i in imgList) {
        let image = imgList[i].buffer
        if (!image && imgList[i].base64Image) {
          image = Buffer.from(imgList[i].base64Image, 'base64')
        }

        const request = buildRequest(realUrl, image, imgList[i].fileName, userConfig)

        const res = await fetchRequest(ctx, request, log)
        if (!res.statusCode) {
          const body = res || {}
          const {results} = body || {}
          const {_links} = (results && results[0]) || {}
          const {download} = _links || {}
          log.warn('download:', JSON.stringify(download))
          imgList[i]['imgUrl'] = `${confluenceBaseUrl}${download || ''}`
          delete imgList[i].base64Image
          delete imgList[i].buffer
        } else {
          log.error('上传失败:', res.error && res.error.message)
          ctx.emit('notification', {
            title: '上传失败',
            body: res.error && res.error.message
          })
        }
      }
    } catch (err) {
      ctx.emit('notification', {
        title: '上传失败',
        body: err
      })
    }
  }

  const fetchRequest = (ctx, request, log) => {
    return new Promise((resolve, reject) => {
      ctx.request(request)
        .then(function (body) {
          resolve(body)
        })
        .catch(function (err) {
          resolve(err)
        })
    })
  }

  /**
   * 请求构建，更多请参考<a src='https://github.com/request/request-promise-native'>Request-Promise-Native</a>
   *
   * @param url
   * @param image
   * @param fileName
   * @param userConfig
   */
  const buildRequest = (url, image, fileName, userConfig = {}) => {
    const userName = userConfig.userName
    const userPassword = userConfig.userPassword
    const headers = {
      contentType: 'multipart/form-data',
      'X-Atlassian-Token': 'nocheck',
      'Authorization': `Basic ${Buffer.from(`${userName}:${userPassword}`).toString('base64')}`
    }
    const formData = {
      file: image,
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
