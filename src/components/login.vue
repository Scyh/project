<template>
  <div class="modal fade" id="modalLogin" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span></button>
          <h4 class="modal-title" id="myModalLabel">登录</h4>
        </div>
        <div class="modal-body">
          <form>
            <label for="username">用户名：</label><input type="text" class="form-control username" name="username">
            <label for="password">密码：</label><input type="password" class="form-control password" name="password">
          </form>
        </div>
        <div class="modal-footer">
          <!-- <div class="pull-left"><input type="checkbox" name="rememberLogin"><label for="rememberLogin">记住密码</label></div> -->
          <button type="button" class="btn btn-default" data-dismiss="modal">取消</button>
          <button type="button" class="btn btn-primary" @click="confirmLogin">确认登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    mounted: function() {
      let that = this;
      $('#modalLogin').on('hide.bs.modal', function () {
        that.resetInput();
      })
    },
    methods: {

      // 验证登录
      confirmLogin: function() {
        let that = this;
        let username = $(".username").val();
        let password = $(".password").val();

        if (username != '' && password != '') {
          $.ajax({
            url: 'http://localhost:3000/api/checkUser',
            dataType: 'JSON',
            data: {
              username: username,
              password: password
            },
          })
          .done(function(data) {
            if (data.status == 'success') {
              // 验证成功，用户存在

              console.log(username)
              // 跳转管理员界面
              if (username == 'admin') {
                console.log("管理员登录")
                sessionStorage.admin = 'admin';
                that.$router.push('/admin');
                that.$store.dispatch("adminLogIn");
                $(".close").trigger('click');
                // location.reload();
              } else {

              // 普通用户登录
                sessionStorage.username = username;
                that.$store.dispatch("logIn");
                let userPermission = data.userData[0].permission;
                if (userPermission < 1) {
                  sessionStorage.forbidden =  true;
                } else {
                  sessionStorage.forbidden =  false;
                }
                $(".close").trigger('click');
                location.reload();
              }

            } else if (data.status == 'fail') {
              // 验证失败，用户不存在
              alert("验证失败")
            } else {
              console.log("验证发生错误")
            }
          })
          .fail(function() {
            console.log("error");
          })
        }
      },

      // 清空输入框
      resetInput: function() {
          $(".username").val("");
          $(".password").val("");
      },
    }
  }
</script>

<style scoped>
  
</style>