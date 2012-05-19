// Generated by CoffeeScript 1.3.1

define('specs/remote', ['remote', 'mocks/hoodie', 'mocks/changes_response', 'mocks/changed_docs', 'mocks/bulk_update_response'], function(Remote, CangMock, ChangesResponseMock, ChangedDocsMock, BulkUpdateResponseMock) {
  return describe("Remote", function() {
    beforeEach(function() {
      this.app = new CangMock;
      this.remote = new Remote(this.app);
      spyOn(this.app, "on");
      spyOn(this.app, "unbind");
      spyOn(this.app, "trigger");
      spyOn(this.app, "request");
      spyOn(this.app.store, "destroy").andReturn({
        then: function(cb) {
          return cb('object_from_store');
        }
      });
      spyOn(this.app.store, "save").andReturn({
        then: function(cb) {
          return cb('object_from_store', false);
        }
      });
      return spyOn(window, "setTimeout");
    });
    describe(".constructor(@app)", function() {
      beforeEach(function() {
        spyOn(Remote.prototype, "connect");
        return this.remote = new Remote(this.app);
      });
      it("should subscribe to `signed_in` event", function() {
        return expect(this.app.on).wasCalledWith('account:signed_in', this.remote.connect);
      });
      it("should subscribe to `signed_out` event", function() {
        return expect(this.app.on).wasCalledWith('account:signed_out', this.remote.disconnect);
      });
      return it("should connect", function() {
        return expect(Remote.prototype.connect).wasCalled();
      });
    });
    describe(".connect()", function() {
      beforeEach(function() {
        spyOn(this.remote, "pull_changes");
        return spyOn(this.remote, "push_changes");
      });
      _when("account is authenticated", function() {
        beforeEach(function() {
          spyOn(this.app.account, "authenticate").andReturn({
            then: function(cb) {
              return cb();
            }
          });
          return this.remote.connect();
        });
        it("should pull changes", function() {
          return expect(this.remote.pull_changes).wasCalled();
        });
        it("should push changes", function() {
          return expect(this.remote.push_changes).wasCalled();
        });
        return it("should subscribe to account's dirty idle event", function() {
          return expect(this.app.on).wasCalledWith('store:dirty:idle', this.remote.push_changes);
        });
      });
      return _when("account is not authenticated", function() {
        beforeEach(function() {
          spyOn(this.app.account, "authenticate").andReturn({
            then: function() {
              return null;
            }
          });
          return this.remote.connect();
        });
        it("shouldn't pull changes", function() {
          return expect(this.remote.pull_changes).wasNotCalled();
        });
        it("shouldn't push changes", function() {
          return expect(this.remote.push_changes).wasNotCalled();
        });
        return it("shouldn't subscribe to account's dirty idle event", function() {
          return expect(this.app.on).wasNotCalled();
        });
      });
    });
    describe(".disconnect()", function() {
      it("should reset the seq number", function() {
        this.remote._seq = 123;
        spyOn(this.app.store.db, "removeItem");
        this.remote.disconnect();
        expect(this.remote._seq).toBeUndefined();
        return expect(this.app.store.db.removeItem).wasCalledWith('_couch.remote.seq');
      });
      return it("should unsubscribe from account's dirty idle event", function() {
        this.remote.disconnect();
        return expect(this.app.unbind).wasCalledWith('store:dirty:idle', this.remote.push_changes);
      });
    });
    describe(".pull_changes()", function() {
      it("should send a longpoll GET request to user's db _changes feed", function() {
        var method, path, _ref;
        spyOn(this.app.account, "user_db").andReturn('joe$examle_com');
        this.remote.pull_changes();
        expect(this.app.request).wasCalled();
        _ref = this.app.request.mostRecentCall.args, method = _ref[0], path = _ref[1];
        expect(method).toBe('GET');
        return expect(path).toBe('/joe%24examle_com/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=0');
      });
      _when("request is successful / returns changes", function() {
        beforeEach(function() {
          var _this = this;
          this.app.request.andCallFake(function(method, path, options) {
            _this.app.request.andCallFake(function() {});
            return options.success(ChangesResponseMock());
          });
          return this.remote.pull_changes();
        });
        it("should remove `todo/abc3` from store", function() {
          return expect(this.app.store.destroy).wasCalledWith('todo', 'abc3', {
            remote: true
          });
        });
        it("should save `todo/abc2` in store", function() {
          return expect(this.app.store.save).wasCalledWith('todo', 'abc2', {
            _rev: '1-123',
            content: 'remember the milk',
            done: false,
            order: 1,
            type: 'todo',
            id: 'abc2'
          }, {
            remote: true
          });
        });
        return it("should trigger remote events", function() {
          expect(this.app.trigger).wasCalledWith('remote:destroyed', 'todo', 'abc3', 'object_from_store');
          expect(this.app.trigger).wasCalledWith('remote:destroyed:todo', 'abc3', 'object_from_store');
          expect(this.app.trigger).wasCalledWith('remote:destroyed:todo:abc3', 'object_from_store');
          expect(this.app.trigger).wasCalledWith('remote:changed', 'destroyed', 'todo', 'abc3', 'object_from_store');
          expect(this.app.trigger).wasCalledWith('remote:changed:todo', 'destroyed', 'abc3', 'object_from_store');
          expect(this.app.trigger).wasCalledWith('remote:changed:todo:abc3', 'destroyed', 'object_from_store');
          expect(this.app.trigger).wasCalledWith('remote:updated', 'todo', 'abc2', 'object_from_store');
          expect(this.app.trigger).wasCalledWith('remote:updated:todo', 'abc2', 'object_from_store');
          expect(this.app.trigger).wasCalledWith('remote:updated:todo:abc2', 'object_from_store');
          expect(this.app.trigger).wasCalledWith('remote:changed', 'updated', 'todo', 'abc2', 'object_from_store');
          expect(this.app.trigger).wasCalledWith('remote:changed:todo', 'updated', 'abc2', 'object_from_store');
          return expect(this.app.trigger).wasCalledWith('remote:changed:todo:abc2', 'updated', 'object_from_store');
        });
      });
      _when("request errors with 403 unauthorzied", function() {
        beforeEach(function() {
          var _this = this;
          return this.app.request.andCallFake(function(method, path, options) {
            _this.app.request.andCallFake(function() {});
            return options.error({
              status: 403
            });
          });
        });
        it("should disconnect", function() {
          spyOn(this.remote, "disconnect");
          this.remote.pull_changes();
          return expect(this.remote.disconnect).wasCalled();
        });
        return it("should trigger an unauthenticated error", function() {
          this.remote.pull_changes();
          return expect(this.app.trigger).wasCalledWith('remote:error:unauthenticated');
        });
      });
      _when("request errors with 404 not found", function() {
        beforeEach(function() {
          var _this = this;
          return this.app.request.andCallFake(function(method, path, options) {
            _this.app.request.andCallFake(function() {});
            return options.error({
              status: 404
            });
          });
        });
        return it("should try again in 3 seconds (it migh be due to a sign up, the userDB might be created yet)", function() {
          this.remote.pull_changes();
          return expect(window.setTimeout).wasCalledWith(this.remote.pull_changes, 3000);
        });
      });
      _when("request errors with 500 oooops", function() {
        beforeEach(function() {
          var _this = this;
          return this.app.request.andCallFake(function(method, path, options) {
            _this.app.request.andCallFake(function() {});
            return options.error({
              status: 500
            });
          });
        });
        it("should try again in 3 seconds (and hope it was only a hiccup ...)", function() {
          this.remote.pull_changes();
          return expect(window.setTimeout).wasCalledWith(this.remote.pull_changes, 3000);
        });
        return it("should trigger a server error event", function() {
          this.remote.pull_changes();
          return expect(this.app.trigger).wasCalledWith('remote:error:server');
        });
      });
      _when("request was aborted manually", function() {
        beforeEach(function() {
          var _this = this;
          return this.app.request.andCallFake(function(method, path, options) {
            _this.app.request.andCallFake(function() {});
            return options.error({
              statusText: 'abort'
            });
          });
        });
        return it("should try again", function() {
          spyOn(this.remote, "pull_changes").andCallThrough();
          this.remote.pull_changes();
          return expect(this.remote.pull_changes.callCount).toBe(2);
        });
      });
      return _when("there is a different error", function() {
        beforeEach(function() {
          var _this = this;
          return this.app.request.andCallFake(function(method, path, options) {
            _this.app.request.andCallFake(function() {});
            return options.error({});
          });
        });
        return it("should try again in 3 seconds", function() {
          this.remote.pull_changes();
          return expect(window.setTimeout).wasCalledWith(this.remote.pull_changes, 3000);
        });
      });
    });
    describe(".push_changes()", function() {
      _when("there are no changed docs", function() {
        beforeEach(function() {
          spyOn(this.app.store, "changed_docs").andReturn([]);
          return this.remote.push_changes();
        });
        return it("shouldn't do anything", function() {
          return expect(this.app.request).wasNotCalled();
        });
      });
      return _when("there is one deleted and one changed doc", function() {
        beforeEach(function() {
          var _ref;
          spyOn(this.app.store, "changed_docs").andReturn(ChangedDocsMock());
          spyOn(this.app.account, "user_db").andReturn('joe$examle_com');
          this.remote.push_changes();
          expect(this.app.request).wasCalled();
          return _ref = this.app.request.mostRecentCall.args, this.method = _ref[0], this.path = _ref[1], this.options = _ref[2], _ref;
        });
        it("should post the changes to the user's db _bulk_docs API", function() {
          expect(this.method).toBe('POST');
          return expect(this.path).toBe('/joe%24examle_com/_bulk_docs');
        });
        it("should set dataType to json", function() {
          return expect(this.options.dataType).toBe('json');
        });
        it("should set processData to false", function() {
          return expect(this.options.processData).toBe(false);
        });
        it("should set contentType to 'application/json'", function() {
          return expect(this.options.contentType).toBe('application/json');
        });
        it("should send the docs in appropriate format", function() {
          var doc, docs;
          docs = JSON.parse(this.options.data).docs;
          doc = docs[0];
          expect(doc.id).toBeUndefined();
          expect(doc._id).toBe('todo/abc3');
          return expect(doc._localInfo).toBeUndefined();
        });
        return _and("the request is successful, but with one conflict error", function() {
          beforeEach(function() {
            var _this = this;
            this.app.request.andCallFake(function(method, path, options) {
              return options.success(BulkUpdateResponseMock());
            });
            return this.remote.push_changes();
          });
          return it("should trigger conflict event", function() {
            return expect(this.app.trigger).wasCalledWith('remote:error:conflict', 'todo/abc2');
          });
        });
      });
    });
    return describe(".on(event, callback)", function() {
      return it("should namespace events with `remote`", function() {
        var cb;
        cb = jasmine.createSpy('test');
        this.remote.on('funky', cb);
        return expect(this.app.on).wasCalledWith('remote:funky', cb);
      });
    });
  });
});
