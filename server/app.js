var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var svgCaptcha = require('svg-captcha');
var fs = require('fs');

// 连接数据库
var mongoose = require('./db.js'),
  db = mongoose(),
  User = require('./models/user.js'),
  Article = require('./models/article.js'),
  Comment = require('./models/comment.js'),
  Notice = require('./models/notice.js'),
  Announcement = require('./models/announcement.js'),
  TipOff = require('./models/tipOff.js'),
  Message = require('./models/message.js'),
  Question = require('./models/questions.js'),
  Answer = require('./models/answer.js');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('.ejs', require('ejs').__express);
app.set('view engine', 'ejs');

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false,
  limit: '10000kb'
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'uploadFile'))); //静态文件目录


// 解决跨域
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", ' 3.2.1')
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

// 验证用户接口
app.get('/api/checkUser', function(req, res, next) {
  User.checkUser({
    username: req.query.username,
    password: req.query.password
  }).then(data => {
    console.log(data)
    if ((data.length * 1) > 0) {
      res.send({
        status: 'success',
        userData: data
      })
    } else {
      res.send({
        status: 'fail'
      })
    }
  }).catch(err => {
    console.log("err: " + err)
  })

  // , function(err, data) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     if ((data * 1) > 0) {
  //       // console.log("用户存在");
  //       console.log(data)
  //       res.send({
  //         status: 'success'
  //       })
  //     } else {
  //       // 用户不存在
  //       res.send({
  //         status: 'fail'
  //       })
  //     }
  //   }
  // }
});

// 验证码
app.get('/api/captcha', function(req, res, next) {
  var captcha = svgCaptcha.create();
  req.cookies.captcha = captcha.text;
  res.send({
    code: captcha.data.toString(),
    text: captcha.text.toString()
  })
});

// 检查用户名唯一
app.get('/api/uniqueUserName', function(req, res, next) {
  User.uniqueUserName({
    username: req.query.username
  }, function(err, data) {
    if (err) {
      console.log(err)
    } else {
      if ((data * 1) > 0) {
        // 用户名存在
        res.send({
          status: 'fail',
        })
      } else {
        res.send({
          status: 'success'
        })
      }
    }
  })
})

// 用户注册接口
app.post('/api/regUser', function(req, res, next) {
  let newUser = new User({
    username: req.body.username,
    password: req.body.password,
    // sex: 'female',
    // job: '',
    // industry: '',
    // birthday: '',
    // introduce: '个人简介'
  })
  newUser.save(function(err, data) {
    if (err) {
      console.log(err)
    } else {
      res.send({
        status: 'success'
      })
    }
  });
})

// 获取单个用户信息
app.get('/api/getUserInfo', function(req, res, next) {
  User.findByUserName({
    username: req.query.username
  }, function(err, data) {
    if (err) {
      console.log(err);
    } else {
      res.json(data);
    }
  })
})

// 更新用户头像
app.post('/api/updateUserProfile', function(req, res, next) {
  User.update({
    'username': req.body.username
  }, {
    "userProfile": req.body.srcStr
  }, function(err, data) {
    if (err) {
      console.log(err);
      res.send({
        status: 'fail'
      })
    } else {
      res.send({
        status: 'success'
      })
    }
  })
})

// 更新用户基本信息
app.post('/api/updateUserInfo', function(req, res, next) {
  User.update({
    username: req.body.username
  }, {
    sex: req.body.sex,
    trueName: req.body.trueName,
    industry: req.body.industry,
    job: req.body.job,
    introduce: req.body.introduce,
    birthday: req.body.birthday
  }, function(err) {
    if (err) {
      console.log(err);
      res.send({
        status: 'fail'
      })
    } else {
      res.send({
        status: 'success'
      })
    }
  })
})

// 获取主页文章中的部分文章
app.get('/api/getArticle', function(req, res, next) {
  Article.fetchPart({
    pageCount: req.query.pageCount,
    category: req.query.category
  }, function(err, article) {
    if (err) {
      console.log(err);
    } else {
      res.json(article);
    }
  })
});

// 初始化文章分页
app.get('/api/getPageCount', function(req, res, next) {
  Article.fetchCount(req.query.category, function(err, data) {
    if (err) {
      console.log(err)
    } else {
      res.json(data);
    }
  })
})

// 获取 article_detail 接口
app.get('/api/getArticleDetail', function(req, res, next) {
  Article.findById(req.query._id, function(err, data) {
    if (err) {
      console.log(err)
    }
    // res.send({
    //   article: article
    // })
    console.log(data)
    res.json(data)

  })
})

// 获取 文章评论 接口
app.get('/api/getComment', function(req, res, next) {
  Comment.fetchComment(req.query._id, function(err, data) {
    if (err) {
      console.log(err)
    } else {

      if (data.length == 0) {
        // console.log("没有评论");
        res.send({
          status: "noComment"
        })
      } else {
        res.json(data);
        // res.send({
        //   status: "hasComment",
        //   article_like: data.article_like,
        //   comment: data.article_comment
        // });  
      }
    }
  })
})

// 回复评论  如果数据库中没有该文章的评论 document ，就新建一张
app.post('/api/reply', function(req, res, next) {
  Comment.count({
      '_article_id': req.body._article_id
    })
    .then(data => {
      let article_comment = {
        'comment_author': req.body.comment_author,
        'comment_date': req.body.comment_date,
        'comment_content': req.body.comment_content
      }

      // 数据库中没有该文章的记录,则新建
      if (data < 1) {
        let newComment = new Comment({
          _article_id: req.body._article_id
        })
        newComment.save().then(data => {

          Comment.addComment({
            newComment_id: data._id,
            reply: article_comment
          }, function(err, data) {
            if (err) {
              console.log(err)
              res.send({
                status: 'fail'
              })
            } else if (data.n == 1 && data.nModified == 1) {
              res.send({
                status: 'success'
              })
            }
          })
        });
      } else {
        Comment.addComment({
          _article_id: req.body._article_id,
          reply: article_comment
        }, function(err, data) {
          if (err) {
            console.log(err)
            res.send({
              status: 'fail'
            })
          } else if (data.n == 1 && data.nModified == 1) {
            res.send({
              status: 'success'
            })
          }
        })
      }

    })
});

// 删除评论
app.post('/api/deleteComment', function(req, res, next) {
  Comment.deleteComment({
    _article_id: req.body._article_id,
    comment_date: req.body.comment_date,
    comment_content: req.body.comment_content
  }).then(data => {
    res.send({
      status: 'success'
    })
  }).catch(err => {
    console.log(err);
    res.send({
      status: 'fail'
    })
  })
})

// 点赞或踩
app.post('/api/likeOrNot', function(req, res, next) {

  // 没有评论只有点赞的时候，需新建comment
  if ((req.body.commentsLength * 1) < 1) {
    let newComment = new Comment({
      _article_id: req.body._article_id
    })

    newComment.save()
      .then(data => {
        Comment.updateLikeOrNot({
          newComment_id: data._id,
          type: req.body.type,
          count: req.body.count,
          user: req.body.user
        }).then(data => {
          if (data.n == 1 && data.nModified == 1) {
            res.send({
              status: 'success'
            })
          }
        })
      }).catch(err => {

      })
  } else {
    Comment.updateLikeOrNot({
      _article_id: req.body._article_id,
      type: req.body.type,
      count: req.body.count,
      user: req.body.user
    }, (err, data) => {
      if (data.n == 1 && data.nModified == 1) {
        res.send({
          status: 'success'
        })
      }
    })
  }
})


// 初始化个人主页的文章tab
app.get('/api/getMyArticles', function(req, res, next) {
  Article.fetchByAuthor({
    username: req.query.username,
    audit: req.query.audit
  }, function(err, data) {
    if (err) {
      console.log(err)
    } else {
      res.send(data);
    }
  })
})

// 获取查看文章
// app.get('/api/getOneArticle', function(req, res, next) {
//   Article.findById(req.query.article_id).then(data => {
//     console.log(data)
//     res.json(data);
//   }).catch(err => {
//     console.log(err)
//   })
// })

// 删除文章
app.post('/api/deleteArticle', function(req, res, next) {
  Article.deleteOne(req.body._id)
    .then(data => {
      // console.log(data)
      res.send({
        status: 'success'
      })
    }).catch(err => {
      console.log(err)
      res.send({
        status: 'fail'
      })
    })
})

// 更新pve
app.post('/api/incPv', function(req, res, next) {
  Article.incPv(req.body._id).then(data => {
    console.log(data);
    res.send({
      status: 'success'
    })
  }).catch(err => {
    console.log("err:" + err)
    res.send({
      status: 'fail'
    })
  })
})


// 发表文章
app.post('/api/publish', function(req, res, next) {
  let newArticle = new Article({
    article_title: req.body.title,
    article_publish_date: Date.parse(new Date),
    article_md_content: req.body.md_content,
    article_content: req.body.content,
    article_author: req.body.author,
    article_label: req.body.subLabel
  });
  newArticle.save().then(data => {
    // console.log(data)
    res.send({
      status: 'success'
    });
  }).catch(err => {
    console.log(err)
    console.log('err')
  })
})

// 图片上传
app.post('/api/img/add', function(req, res, next) {
  // let newImg = new ImgStorage({
  //   lastModified: req.body.lastModified,
  //   miniurl: req.body.miniurl,
  //   name: req.body.name,
  //   author: req.body.author
  // })
  // newImg.save().then(data => {
  //   console.log(data)
  // }).catch(err => {
  //   console.log(err)
  // })

  var dataBuffer = new Buffer(req.body.miniurl, 'base64');
  // let imgName = req.body.name

  // 图片文件名  文章作者名+lastModified+文件类型 
  let imgName = req.body.author + req.body.lastModified + '.' + req.body.type
  console.log(imgName);
  fs.writeFile(__dirname + '/uploadFile/' + imgName, dataBuffer, err => {
    if (err) {
      console.log(err);
      res.send({
        status: 'fail'
      })
    } else {
      console.log('upload saved')
      res.send({
        imgUrl: 'http://localhost:3000/' + imgName,
        status: 'success'
      })
    }
  })
})

// 修改文章
app.post('/api/upadteOldArticle', function(req, res, next) {
  Article.updateOldArticle({
    _id: req.body.id,
    article_title: req.body.title,
    article_md_content: req.body.md_content,
    article_content: req.body.content,
    article_label: req.body.subLabel,
    category: req.body.category
  }).then(data => {
    // console.log(data)
    res.send({
      status: 'success'
    })
  }).catch(err => {
    console.log(err)
    res.send({
      status: 'fail'
    })
  })
})

// 举报文章
app.post('/api/tipOff', function(req, res, next) {
  let body = req.body;
  let newTipOff = new TipOff({
    tip_off_content: body.tip_off_content,
    tip_off_by: body.tip_off_by,
    tip_off_to: body.tip_off_to,
    tip_off_date: Date.parse(new Date),
    tip_off_article_title: body.article_title,
    tip_off_article_id: body.article_id
  })
  newTipOff.save()
    .then(data => {
      if (data._id) {
        res.send({
          status: 'success'
        })
      } else {
        res.send({
          status: 'fail'
        })
      }

    }).catch(err => {
      console.log(err);
      res.send({
        status: 'fail'
      })
    })
})

// 初始化 个人通知tab
app.get('/api/getMyNotice', function(req, res, next) {
  Notice.fecthNotice(req.query.user)
    .then(data => {
      res.json(data);
    })
    .catch(err => {
      console.log(err)
    })
})

// 个人通知 标记全读
app.post('/api/noticeAllRead', function(req, res, next) {
  Notice.findById(req.body._id).then(data => {
    for (let i in data.notice) {
      data.notice[i].notice_state = 'hasRead';
    }
    let newNotice = new Notice(data);
    newNotice.save((err, data) => {
      if (err) {
        console.log(data);
      } else {
        res.send({
          status: 'success'
        })
      }
    })
  })
})

// 清空 个人通知
app.post('/api/clearAllNotice', function(req, res, next) {
  Notice.clearAllNotice(req.body._id, (err, data) => {
    if (err) {
      console.log(err)
    } else {
      console.log(data);
      res.send({
        status: 'success'
      })
    }
  })
})

// 添加通知
app.post('/api/addNotice', function(req, res, next) {
  Notice.count({
    "notice_user": req.body.notice_user
  }, function(err, data) {
    console.log(data)
    let noticeObj = {
      notice_state: req.body.notice_state,
      notice_date: req.body.notice_date,
      notice_ByUser: req.body.notice_ByUser,
      notice_type: req.body.notice_type,
      notice_title: req.body.notice_title,
      notice_title_id: req.body.notice_title_id
    };

    if ((data * 1) > 0) {
      // 有记录，直接更新notice
      console.log("有记录，直接更新notice")
      Notice.addNotice({
        username: req.body.notice_user,
        notice: noticeObj,
      }, function(err, data) {
        if (err) {
          console.log(err)
        }
        console.log(data);

      })

    } else {
      // 没有记录，需新建notice的
      console.log("// 没有记录，需新建notice的")
      let newNotice = new Notice({
        notice_user: req.body.notice_user,
        notice: noticeObj
      })
      newNotice.save((err, data) => {
        if (err) {
          console.log(err)
        } else {
          console.log(data);
          // res.send({
          //   status: 'success'
          // })
        }
      })
    }
  })
})

// 搜索文章或问题
app.get('/api/search', function(req, res, next) {
  Article.search(req.query.key, function(err, data) {
    if (err) {
      console.log(err);
      console.log('err')
    } else {
      res.json(data)
    }
  })
})

// 获取公告
app.get('/api/getAnnouncementAndHotArticle', function(req, res, next) {
  Announcement.getFourAnnouncements()
    .then(announcement => {
      Article.fetchSortByPv().then(hotArticle => {
        res.send({
          announcement: announcement,
          hotArticle: hotArticle
        })
      })
    }).catch(err => {
      console.log(err)
    })
})

//  公告页初始化
app.get('/api/initAnnouncement', function(req, res, next) {
  Announcement.findById(req.query.id)
    .then(data => res.json(data))
    .catch(err => {
      console.log(err)
      res.send({
        status: 'fail'
      })
    })
})

// 获取留言
app.get('/api/getMsg', function(req, res, next) {
  Message.fetchAllLength().then(length => {
    console.log(Math.ceil(length / req.query.itemShow));
    Message.fetchMsg({
      page: req.query.page,
      itemShow: req.query.itemShow
    }).then(data => {
      if (data.length > 0) {
        res.send({
          status: 'success',
          msg: data,
          allPages: Math.ceil(length / req.query.itemShow)
        })
      } else {
        res.send({
          status: 'success',
          msg: [],
          allPages: 0
        })
      }
    }).catch(err => {
      console.log(err);
      res.send({
        status: 'fail'
      })
    })

  })

})

// 留言
app.post('/api/leaveMsg', function(req, res, next) {
  let newMsg = new Message({
    msg_by: req.body.msg_by,
    msg_content: req.body.msg_content,
    msg_date: Date.parse(new Date())
  })
  newMsg.save()
    .then(data => {
      if (data._id) {
        res.send({
          status: 'success'
        })
      } else {
        res.send({
          status: 'fail'
        })
      }
    }).catch(err => {
      console.log(err);
      res.send({
        status: 'fail'
      })
    })
})

// 上传提问
app.post('/api/askQuestion', (req, res, next) => {
  let newQuestion = new Question({
    question_author: req.body.question_author,
    question_title: req.body.question_title,
    question_text: req.body.question_text,
    question_date: new Date().valueOf(),
    question_catogery: req.body.question_catogery,
  });

  newQuestion.save().then(data => {
    console.log(data)
    res.send({status: 'success'})
  }).catch(err => {
    res.send({status: 'fail'})
  })
})

// 获取问题
app.get('/api/getQuestion', (req, res, next) => {
  Question.fetchQuestion({
    type: req.query.type,
    page: req.query.page
  }).then(data => {
    res.json(data)
  }).catch(err => {
    console.log(err)
  })
})

// 获取自己的提问
app.get('/api/getMyQuestions', (req, res, next) => {
  Question.fetchMyQuestion({
    question_author: req.query.question_author,
    audit: req.query.audit
  }).then(data => {
    console.log(data)
    res.json(data)
  }).catch(err => {
    console.log(err)
  })
})

// 获取单个问题
app.get('/api/getQuestionDetail', (req, res, next) => {
  Question.findById(req.query.question_id).then(data => {
    res.json(data)
  }).catch(err => {
    console.log(err)
  })
})

// 获取问题的答案
app.get('/api/getQuestionAnswer', (req, res, next) => {
  Answer.findByBelongsTo(req.query.question_id).then(data => {
    res.json(data)
  }).catch(err => {
    console.log(err)
  })
})

// 回答问题
app.post('/api/answerQuestion', (req, res, next) => {
  let newAnswer = new Answer({
    answer_author: req.body.answer_author,
    answer_text: req.body.answer_text,
    answer_date: req.body.answer_date,
    answer_belongsTo: req.body.answer_belongsTo
  });

  newAnswer.save().then(data => {
    res.send({
      'status': 'success',
      newAnswer: data
    })
  }).catch(err => {
    console.log(err)
    res.send({'status': 'fail'});
  }).then(() => {

    Question.incAnswerCount(req.body.answer_belongsTo).then(data => {
      console.log(data)
    }).catch(err => {
      console.log(err)
    })
  })
})

// 答案被采纳之后, 需要将问题更新成已解决
app.post('/api/adoptQuestion', (req, res, next) => {
  Answer.adoptAnswer(req.body.answer_id).then(data => {
    res.send({'status': 'success'})
  }).catch(err => {
    res.send({'status': 'fail'})
  }).then(() => {
    
    // Question.solved(req.body.question_id).then(data => {
    //   console.log(data)
    // }).catch(err => {
    //   console.log(err)
    // })

  })
})

// test 
app.get('/api/test', function(req, res, next) {
  // Announcement.find({}).sort({'announcement_date': -1}).then(data=> {
  //   console.log(data)
  // })
})


/*
 * 管理员部分接口
 */

// 获取所以用户信息
app.get('/api/admin/getAllUserInfo', function(req, res, next) {
  User.adminFetchSome(req.query.page)
    .then(users => {
      User.count({})
        .then(count => {
          res.send({
            count: count,
            users: users
          })
        })
    })
})

// 删除用户
app.post('/api/admin/deleteUser', function(req, res, next) {
  User.deleteUser(req.body.id).then(data => {
    if (data.result.n == 1 && data.result.ok == 1) {
      res.send({
        status: 'success'
      })
    }
  }).catch(err => {
    console.log('err: ' + err);
    res.send({
      status: 'fail'
    })
  })
})

// 禁言用户
app.post('/api/admin/permission', function(req, res, next) {
  User.permission({
    id: req.body.id,
    permission: req.body.permission
  }).then(data => {
    if (data.n == 1 && data.nModified == 1) {
      res.send({
        status: 'success'
      })
    }
  }).catch(err => {
    console.log("err:" + err)
    res.send({
      status: 'fail'
    })
  })
})

// 搜索用户
app.post('/api/admin/searchUser', function(req, res, next) {
  User.searchUser(req.body.username).then(data => {
    res.json(data)
  }).catch(err => {
    console.log("err: " + err);
  })
})

// 获取文章
app.get('/api/admin/getArticle', function(req, res, next) {
  Article.adminFetchSome({
      type: req.query.type,
      page: req.query.page
    })
    .then(articles => {
      if (req.query.type == 'all') {
        Article.count({}).then(count => {
          res.send({
            articles: articles,
            count: count
          })
        })
      } else {
        Article.count({
            'article_audit': req.query.type
          })
          .then(count => {
            res.send({
              articles: articles,
              count: count
            })
          })
      }
    })
})

// 通过审核
app.post('/api/admin/hasAudited', function(req, res, next) {
  Article.audit(req.body.id).then(data => {
    if (data.n == 1 && data.nModified == 1 && data.ok == 1) {
      res.send({
        status: 'success'
      })
    } else {
      res.send({
        status: 'fail'
      })
    }
  }).catch(err => {
    console.log('err:' + err);
    res.send({
      status: 'fail'
    })
  })
})

//  审核不通过，应当通知文章作者

// 获取公告
app.get('/api/admin/getAnnouncements', function(req, res, next) {
  Announcement.find({}).then(data => {
    res.send(data)
  }).catch(err => {
    console.log('err:' + err);
  })
})

// 查看公告
app.get('/api/admin/getOneAnnouncement', function(req, res, next) {
  Announcement.findById(req.query.id).then(data => {
    res.json(data)
  }).catch(err => {
    console.log(err)
  })
})

// 删除公告
app.post('/api/admin/delAnnouncement', function(req, res, next) {
  Announcement.deleteOne(req.body.id)
    .then(data => {
      // console.log(data)
      let result = data.result
      if (result.n == 1 && result.ok == 1) {
        res.send({
          status: 'success'
        })
      } else {
        res.send({
          status: 'fail'
        })
      }
    }).catch(err => {
      console.log(err);
      res.send({
        status: 'fail'
      })
    })
})

// 发表公告
app.post('/api/admin/announcementPublish', function(req, res, next) {
  let newAnnouncement = new Announcement({
    announcement_title: req.body.title,
    announcement_content: req.body.content,
    announcement_date: Date.parse(new Date())
  });

  newAnnouncement.save().then(data => {
    res.send({
      status: 'success'
    })
  }).catch(err => {
    console.log(err)
    res.send({
      status: 'fail'
    })
  })
})

// 获取举报信息
app.get('/api/admin/getTipOff', function(req, res, next) {
  TipOff.adminFetchSome(req.query.page)
    .then(data => {
      // console.log(data);
      res.json(data)
    }).catch(err => {
      console.log(err)
      res.send({
        status: 'fail'
      })
    })
})

// 留言状态操作，hasRead已读 / notRead未读
app.post('/api/admin/operateMsgStatus', function(req, res, next) {
  Message.operateMsgStatus(req.body.msgArr)
    .then(data => {
      // console.log(Array.from(JSON.parse(req.body.msgArr)).length)
      if (data.n > 0 && data.ok == 1) {
        res.send({
          status: 'success'
        })
      } else {
        res.send({
          status: 'fail'
        })
      }
    }).catch(err => {
      console.log(err)
      res.send({
        status: 'fail'
      })
    })
})

// 删除留言
app.post('/api/admin/delMsg', function(req, res, next) {
  Message.delMsg(req.body.msgArr)
    .then(data => {
      console.log(data)
      if (data.result.n > 0 && data.result.ok > 0) {
        res.send({
          status: 'success'
        })
      } else {
        res.send({
          status: 'fail'
        })
      }
      
    }).catch(err => {
      console.log(err);
      res.send({
          status: 'fail'
        })
    })
})

// 删除所有举报信息
app.post('/api/admin/delAllTipOff', function(req, res, next) {
  TipOff.remove({})
    .then(data => {
      res.send({
        status: 'success'
      })
    }).catch( err => {
      console.log(err);

    })
})

// 获取提问
app.get('/api/admin/getQuestion', (req, res, next) => {
  Question.adminFetchSome({
    type: req.query.type,
    page: req.query.page
  }).then(data => {
    res.json(data);
  }).catch(err => {
    console.log(err)
  })
})

// 删除提问
app.post('/api/admin/deleteQuestion', (req, res, next) => {
  Question.deleteOne(req.body._id)
  .then(data => {
    res.send({status: 'success'})
  }).catch(err => {
    console.log(err)
    res.send({status: 'fail'})
  })
})

// 提问通过审核
app.post('/api/admin/questionHasAudited', function(req, res, next) {
  Question.audit(req.body.id).then(data => {
    if (data.n == 1 && data.nModified == 1 && data.ok == 1) {
      res.send({
        status: 'success'
      })
    } else {
      res.send({
        status: 'fail'
      })
    }
  }).catch(err => {
    console.log('err:' + err);
    res.send({
      status: 'fail'
    })
  })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.listen(3000);
console.log('success listen…………');