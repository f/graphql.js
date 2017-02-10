!(function ($) {

  function processQuery(query, fragments) {
    var fragmentRegexp = /\.\.\.\s*([A-Za-z0-9]+)/g
    var usedFragments = $.map(query.match(fragmentRegexp), function (fragment) {
      return fragments[fragment.replace(fragmentRegexp, function (_, $m) {return $m})]
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
    var fragmentObject = {}
    $.each(fragments, function (name, fragment) {
      fragmentObject[name] = "\nfragment " + name + " " + fragment
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
          type: "post",
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
      fragments = processFragments($.extend(options.fragments, fragment))
      return fragments
    }

    return sender
  }
}(jQuery))
