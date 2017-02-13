var GraphQLClient = (function ($) {
  function GraphQLClient(url, options) {
    if (!options)
      options = {}
    
    if (!options.fragments)
      options.fragments = {}

    this.options = options
    this._fragments = this.buildFragments(options.fragments)
    this._sender = this.createSenderFunction(url, this._fragments)
    this.createHelpers(this._sender)
  }

  // "fragment auth.login" will be "fragment auth_login"
  GraphQLClient.FRAGMENT_SEPERATOR = "_"

  // The autotype keyword.
  GraphQLClient.AUTOTYPE_PATTERN = /\(@autotype\)/

  // Flattens nested object
  /*
   * {a: {b: {c: 1, d: 2}}} => {"a.b.c": 1, "a.b.d": 2}
   */
  GraphQLClient.prototype.flatten = function (object) {
    var prefix = arguments[1] || "", out = arguments[2] || {}, name
    for (name in object) {
      if (object.hasOwnProperty(name)) {
        typeof object[name] == "object"
          ? this.flatten(object[name], prefix + name + GraphQLClient.FRAGMENT_SEPERATOR, out)
          : out[prefix + name] = object[name]
      }
    }
    return out
  }

  // Gets path from object
  /*
   * {a: {b: {c: 1, d: 2}}}, "a.b.c" => 1
   */
  GraphQLClient.prototype.fragmentPath = function (fragments, path) {
    var getter = new Function("fragments", "return fragments." + path.replace(/\./g, GraphQLClient.FRAGMENT_SEPERATOR))
    var obj = getter(fragments)
    if (!obj || typeof obj != "string") {
      throw "Fragment " + path + " not found"
    }
    return obj
  }

  GraphQLClient.prototype.processQuery = function (query, fragments) {
    var that = this
    var fragmentRegexp = /\.\.\.\s*([A-Za-z0-9\.]+)/g
    var collectedFragments = query.match(fragmentRegexp).map(function (fragment) {
      var path = fragment.replace(fragmentRegexp, function (_, $m) {return $m})
      return that.fragmentPath(fragments, path)
    })
    query = query.replace(fragmentRegexp, function (_, $m) {
      return "..." + $m.split(".").join(GraphQLClient.FRAGMENT_SEPERATOR)
    })
    return [query].concat(collectedFragments).join("\n")
  }

  GraphQLClient.prototype.autoType = function (query, variables) {
    var typeMap = {
      string: "String",
      number: "Int",
      boolean: "Boolean"
    }
    return query.replace(GraphQLClient.AUTOTYPE_PATTERN, function () {
      var types = []
      for (var key in variables) {
        var value = variables[key]
        var keyAndType = key.split("!")
        var type = (keyAndType[1] || typeMap[typeof(value)])
        if (type) {
          types.push("$" + keyAndType[0] + ": " + type + "!")
        }
      }
      types = types.join(", ")
      return "("+ types +")"
    })
  }

  GraphQLClient.prototype.cleanAutoTypeAnnotations = function (variables) {
    if (!variables) variables = {}
    var newVariables = {}
    for (var key in variables) {
      var value = variables[key]
      var keyAndType = key.split("!")
      newVariables[keyAndType[0]] = value
    }
    return newVariables
  }

  GraphQLClient.prototype.buildFragments = function (fragments) {
    var that = this
    fragments = this.flatten(fragments || {})
    var fragmentObject = {}
    for (var name in fragments) {
      var fragment = fragments[name]
      if (typeof fragment == "object") {
        fragmentObject[name] = that.buildFragments(fragment)
      } else {
        fragmentObject[name] = "\nfragment " + name + " " + fragment
      }
    }
    return fragmentObject
  }

  GraphQLClient.prototype.createSenderFunction = function (url, fragments) {
    var that = this
    return function (query) {
      var caller = function (variables, requestOptions) {
        if (!requestOptions) requestOptions = {}
        if (!variables) variables = {}
        var defer = $.Deferred()
        var fragmentedQuery = that.autoType(that.processQuery(query, fragments), variables)
        headers = $.extend((that.options.headers||{}), (requestOptions.headers||{}))
        $.ajax({
          type: that.options.method || "post",
          url: url,
          headers: headers,
          dataType: "json",
          data: {query: fragmentedQuery, variables: that.cleanAutoTypeAnnotations(variables)},
          error: function (response) {
            defer.reject(response)
          },
          success: function (response) {
            if (response.errors) {
              defer.reject(response.errors)
            } else if (response.data) {
              defer.resolve(response.data)
            } else {
              defer.reject(response)
            }
          }
        })
        return defer
      }
      if (arguments.length > 1) {
        return caller.apply(null, Array.prototype.slice.call(arguments, 1))
      }
      return caller
    }
  }

  GraphQLClient.prototype.createHelpers = function (sender) {
    var that = this
    function helper(query) {
      var caller = sender(this.prefix + " " + query)
      if (arguments.length > 1) {
        return caller.apply(null, Array.prototype.slice.call(arguments, 1))
      } else {
        return caller
      }
    }

    this.mutate = helper.bind({prefix: "mutation"})
    this.query = helper.bind({prefix: "query"})
    this.subscription = helper.bind({prefix: "subscription"})
    this.fragment = function (fragment) {
      return that._fragments = that.buildFragments($.extend(true, that.options.fragments, fragment))
    }

    var helperMethods = ['mutate', 'query', 'subscription']
    helperMethods.forEach(function (m) {
      that[m].run = function (query) {
        return that[m](query, {})
      }
    })
    this.run = function (query) {
      return sender(query, {})
    }
  }

  $.graphql = function (url, options) {
    return new GraphQLClient(url, options)
  }

  return GraphQLClient
})(jQuery)
