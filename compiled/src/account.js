// Generated by CoffeeScript 1.3.1
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

define('account', function() {
  var Account;
  return Account = (function() {

    Account.name = 'Account';

    Account.prototype.email = void 0;

    function Account(app) {
      this.app = app;
      this._handle_sign_out = __bind(this._handle_sign_out, this);

      this._handle_sign_in = __bind(this._handle_sign_in, this);

      this.email = this.app.store.db.getItem('_couch.account.email');
      this.authenticate();
      this.on('signed_in', this._handle_sign_in);
      this.on('signed_out', this._handle_sign_out);
    }

    Account.prototype.authenticate = function() {
      var defer,
        _this = this;
      defer = this.app.defer();
      if (!this.email) {
        return defer.reject().promise();
      }
      if (this._authenticated === true) {
        return defer.resolve(this.email).promise();
      }
      if (this._authenticated === false) {
        return defer.reject().promise();
      }
      this.app.request('GET', "/_session", {
        success: function(response) {
          if (response.userCtx.name) {
            _this._authenticated = true;
            _this.email = response.userCtx.name;
            return defer.resolve(_this.email);
          } else {
            _this._authenticated = false;
            _this.app.trigger('account:error:unauthenticated');
            return defer.reject();
          }
        },
        error: defer.reject
      });
      return defer.promise();
    };

    Account.prototype.sign_up = function(email, password) {
      var defer, key, prefix,
        _this = this;
      defer = this.app.defer();
      prefix = 'org.couchdb.user';
      key = "" + prefix + ":" + email;
      this.app.request('PUT', "/_users/" + (encodeURIComponent(key)), {
        data: JSON.stringify({
          _id: key,
          name: email,
          type: 'user',
          roles: [],
          password: password
        }),
        contentType: 'application/json',
        success: function() {
          _this.app.trigger('account:signed_up', email);
          _this.app.trigger('account:signed_in', email);
          return defer.resolve(email);
        },
        error: defer.reject
      });
      return defer.promise();
    };

    Account.prototype.sign_in = function(email, password) {
      var defer,
        _this = this;
      defer = this.app.defer();
      this.app.request('POST', '/_session', {
        data: {
          name: email,
          password: password
        },
        success: function() {
          _this.app.trigger('account:signed_in', email);
          return defer.resolve(email);
        },
        error: defer.reject
      });
      return defer.promise();
    };

    Account.prototype.login = Account.prototype.sign_in;

    Account.prototype.change_password = function(current_password, new_password) {
      return alert('change password is not yet implementd');
    };

    Account.prototype.sign_out = function() {
      var _this = this;
      return this.app.request('DELETE', '/_session', {
        success: function() {
          return _this.app.trigger('account:signed_out');
        }
      });
    };

    Account.prototype.logout = Account.prototype.sign_out;

    Account.prototype.on = function(event, cb) {
      return this.app.on("account:" + event, cb);
    };

    Account.prototype.user_db = function() {
      var _ref;
      return (_ref = this.email) != null ? _ref.toLowerCase().replace(/@/, "$").replace(/\./g, "_") : void 0;
    };

    Account.prototype._handle_sign_in = function(email) {
      this.email = email;
      this.app.store.db.setItem('_couch.account.email', this.email);
      return this._authenticated = true;
    };

    Account.prototype._handle_sign_out = function() {
      delete this.email;
      this.app.store.db.removeItem('_couch.account.email');
      return this._authenticated = false;
    };

    return Account;

  })();
});
