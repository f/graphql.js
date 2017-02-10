!(function ($) {
  $.graphql = function (url, headers, fragments) {
    if (!fragments) fragments = {}
    var fragmentObject = {}
    $.each(fragments, function (name, fragment) {
      fragmentObject[name] = "fragment " + name + " " + fragment
    })
    function processQuery(query) {
      var fragmentRegexp = /\.\.\.\s*([A-Za-z0-9]+)/g
      var usedFragments = $.map(query.match(fragmentRegexp), function (fragment) {
        return fragmentObject[fragment.replace(fragmentRegexp, function (_, $m) {return $m})]
      })
      return [query].concat(usedFragments).join("\n")
    }
    return function (query, variables, overrideHeaders) {
      var defer = $.Deferred()
      var fragmentedQuery = processQuery(query)
      $.ajax({
        type: "post",
        url: url,
        headers: $.extend(headers, overrideHeaders),
        dataType: "json",
        data: {query: fragmentedQuery, variables: variables},
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
  }
}(jQuery))
