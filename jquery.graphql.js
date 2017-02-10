!(function ($) {

  var N_FRAG_SEP = "_"

  function flatten(object) {
    var prefix = arguments[1] || "", out = arguments[2] || {}, name;
    for (name in object) {
      if (object.hasOwnProperty(name)) {
        typeof object[name] == "object"
          ? flatten(object[name], prefix + name + N_FRAG_SEP, out)
          : out[prefix + name] = object[name]
      }
    }
    return out
  }

  function fragmentPath(fragments, path) {
    var fn = new Function("fragments", "return fragments." + path.replace(/\./g, N_FRAG_SEP))
    var obj = fn(fragments)
    if (!obj || typeof obj != "string") {
      throw "Fragment " + path + " not found"
    }
    return obj
  }

  function processQuery(query, fragments) {
    var fragmentRegexp = /\.\.\.\s*([A-Za-z0-9\.]+)/g
    var usedFragments = $.map(query.match(fragmentRegexp), function (fragment) {
      var path = fragment.replace(fragmentRegexp, function (_, $m) {return $m})
      return fragmentPath(fragments, path)
    })
    query = query.replace(fragmentRegexp, function (_, $m) {
      return "..." + $m.split(".").join(N_FRAG_SEP)
    })
    return [query].concat(usedFragments).join("\n")
  }

  function processQueryTypes(query, variables) {
    var typeMap = {
      string: "String",
      number: "Int",
      boolean: "Boolean"
    }
    return query.replace(/\(@autotype\)/, function () {
      var types = $.map(variables, function (value, key) {
        var keyAndType = key.split("!")
        var type = (keyAndType[1] || typeMap[typeof(value)])
        if (type) {
          return "$" + keyAndType[0] + ": " + type + "!"
        }
      }).join(", ")
      return "("+ types +")"
    })
  }

  function processVariables(variables) {
    if (!variables) variables = {}
    var newVariables = {}
    $.each(variables, function (key, value) {
      var keyAndType = key.split("!")
      newVariables[keyAndType[0]] = value
    })
    return newVariables
  }

  function processFragments(fragments) {
    fragments = flatten(fragments || {})
    var fragmentObject = {}
    var nameStack = []
    $.each(fragments, function (name, fragment) {
      if (typeof fragment == "object") {
        fragmentObject[name] = processFragments(fragment)
      } else {
        fragmentObject[name] = "\nfragment " + name + " " + fragment
      }
    })
    return fragmentObject
  }

  $.graphql = function (url, options) {
    if (!options) options = {}
    if (!options.fragments) options.fragments = {}

    var fragments = processFragments(options.fragments)
    
    var sender = function (query) {
      var caller = function (variables, requestOptions) {
        if (!requestOptions) requestOptions = {}
        if (!variables) variables = {}
        var defer = $.Deferred()
        var fragmentedQuery = processQueryTypes(processQuery(query, fragments), variables)
        headers = $.extend((options.headers||{}), (requestOptions.headers||{}))
        $.ajax({
          type: options.method || "post",
          url: url,
          headers: headers,
          dataType: "json",
          data: {query: fragmentedQuery, variables: processVariables(variables)},
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

    function helper(query) {
      var caller = sender(this.prefix + " " + query)
      if (arguments.length > 1) {
        return caller.apply(null, Array.prototype.slice.call(arguments, 1))
      } else {
        return caller
      }
    }

    sender.mutate = $.proxy(helper, {prefix: "mutation"})
    sender.query = $.proxy(helper, {prefix: "query"})
    sender.subscription = $.proxy(helper, {prefix: "subscription"})
    sender.fragment = function (fragment) {
      fragments = processFragments($.extend(true, options.fragments, fragment))
      return fragments
    }

    return sender
  }
}(jQuery))
