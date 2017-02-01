var bcolor;
var geocoder = null;
var map = null;
var layer = null;
var nabelayer = null;
var marker = null;
var daycareArray = [];
var myObj;
var markersArray = [];
var markerList = {};
var dateArray;
var infoOn = false;
var theAddress;
var infoWindow;
var searchText;
var searchType = $.bbq.getState("st");
var address;
var tableid = "1Ak6rmRmwIJTyVdGrJwmI612EqAOFb_iirn3k3Flc";
var nabe_table_id = "1-eMulyoN76Ujlm7X6KyoKeJarSClpjVuVScwRys";
var zip_table_id = "1yhdGYkKNwcKEfY8o-33cT8xiVocsrZ5k4X7Pv7I";
var queryUrlHead = "https://www.googleapis.com/fusiontables/v1/query?sql=";

function codeAddress() {
    searchType = "geo";
    searchText = document.getElementById("searchBox").value;
    if (!searchText) {} else {
        var e = document.getElementById("searchBox").value;
        if (/[~`!#$%\^&*+=\[\]\\';{}|\\":<>()@\\/?]/g.test(e) == false) {
            geocoder.geocode({
                address: e + " NYC",
                region: "ny"
            }, geocoderCallback)
        } else {
            alert("Please enter an exact address, neigborhood or zip code")
        }
        theAddress = searchText;
        $.bbq.pushState({
            loc: theAddress,
            st: "geo"
        })
    }
}

function initialize() {
    $("#clickMe").on("click", function() {
        log("clicked");
        $("#container").scrollTo({
            top: 800,
            left: 700
        }, 800);
    })
    theAddress = $.bbq.getState("loc");
    if (theAddress === undefined) {
        theAddress = "Park Slope"
    } else {
        if (searchType == "geo") {
            codeAddress()
        } else {
            loadDaycare(theAddress)
        }
    }
    map = new google.maps.Map(document.getElementById("map_canvas"), {
        center: new google.maps.LatLng(40.744363, -73.998463),
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
        },
        panControl: false,
        streetViewControl: false,
        scrollwheel: false,
        disableDoubleClickZoom: true
    });
    geocoder = new google.maps.Geocoder;
    geocoder.geocode({
        address: theAddress,
        region: "ny"
    }, geocoderCallback);
    var e = [{
        stylers: [{
            saturation: -90
        }]
    }];
    map.setOptions({
        styles: e
    });
    $(".enter-butt").on("click", function() {
        searchText = document.getElementById("searchBox").value;
        if (!searchText) {} else {
            codeAddress()
        }
    });
    var availableTags;
    $.getJSON("js/daycarelist.json", function(data) {
        availableTags = data;
        $("#tags").autocomplete({
            delay: 0,
            minLength: 3,
            source: availableTags,
            select: function(event, ui) {
                loadDaycare(ui.item ? ui.item.value : "Nothing selected, input was " + this.value);
            }
        })
        $("#tags").keypress(function(e) {
            if (searchText) {
                $("#searchBox").val('');
            }
            if (e.keyCode == 13) {
                loadDaycare(this.value);
            }
        });
    });
}

function loadDaycare(daycare) {
    searchType = "daycare"
    theAddress = searchText;
    $.bbq.pushState({
        loc: daycare,
        st: "daycare"
    })
    getRestData(tableid);

    function getRestData(e) {
        clearMarkers();
        strInputString = daycare.replace(/'/g, "\\'");
        query = "SELECT FacilityName, full_address, Latitude, Longitude, FacilityID, City, State, ZipCode, Profile, LICENSEDBY FROM " + e + " WHERE FacilityName = '" + strInputString + "' ORDER BY FacilityName DESC&key=AIzaSyC_sekJ9pwKGr6m8bHxZ2z5NixlD35P0qo"
        var t = queryUrlHead + query;
        var n = $.getJSON(t, buildObj, "jsonp")
    }
}

function geocoderCallback(results, status) {
    $("#tags").val('');

    function getData(e) {
        clearMarkers();
        if (/^\d{5}(-\d{4})?(?!-)$/g.test(theAddress) == true) {
            query = "SELECT FacilityName, full_address, Latitude, Longitude, FacilityID, City, State, ZipCode, Profile, LICENSEDBY FROM " + e + " WHERE ZipCode = " + theAddress + " ORDER BY FacilityName DESC&key=AIzaSyC_sekJ9pwKGr6m8bHxZ2z5NixlD35P0qo"
        } else {
            query = "SELECT FacilityName, full_address, Latitude, Longitude, FacilityID, City, State, ZipCode, Profile, LICENSEDBY FROM " + e + " WHERE ST_INTERSECTS(Latitude, CIRCLE(LATLNG(" + lat + ", " + lng + "),850)) ORDER BY FacilityName DESC&key=AIzaSyC_sekJ9pwKGr6m8bHxZ2z5NixlD35P0qo"
        }
        var t = queryUrlHead + query;
        var n = $.getJSON(t, buildObj, "jsonp")
    }
    if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        var lat = results[0].geometry.location.lat();
        var lng = results[0].geometry.location.lng();
        if (marker) marker.setMap(null)
    }
    if (searchType == "geo") {
        if (/^\d{5}(-\d{4})?(?!-)$/g.test(theAddress) == true) {
            if (!nabelayer) {
                nabelayer = new google.maps.FusionTablesLayer({
                    query: {
                        select: "geometry",
                        from: zip_table_id,
                        where: "ZCTA5CE00 = " + theAddress
                    }
                });
                nabelayer.setOptions({
                    styles: [{
                        polygonOptions: {
                            strokeColor: "#00aeff",
                            strokeOpacity: 1,
                            strokeWeight: 2,
                            fillColor: "#ffffff",
                            fillOpacity: 0
                        }
                    }],
                    suppressInfoWindows: true
                });
                nabelayer.setMap(map)
            } else {
                nabelayer.setOptions({
                    query: {
                        select: "geometry",
                        from: zip_table_id,
                        where: "ZCTA5CE00 = " + theAddress,
                        limit: 1
                    }
                })
            }
        } else {
            if (!nabelayer) {
                nabelayer = new google.maps.FusionTablesLayer({
                    query: {
                        select: "geometry",
                        from: nabe_table_id,
                        where: "ST_INTERSECTS(geometry, CIRCLE(LATLNG(" + lat + ", " + lng + "), 1))"
                    }
                });
                nabelayer.setOptions({
                    styles: [{
                        polygonOptions: {
                            strokeColor: "#00aeff",
                            strokeOpacity: 1,
                            strokeWeight: 2,
                            fillColor: "#ffffff",
                            fillOpacity: 0
                        }
                    }],
                    suppressInfoWindows: true
                });
                nabelayer.setMap(map)
            } else {
                nabelayer.setOptions({
                    query: {
                        select: "geometry",
                        from: nabe_table_id,
                        where: "ST_INTERSECTS(geometry, CIRCLE(LATLNG(" + lat + ", " + lng + "), 1))",
                        limit: 1
                    }
                })
            }
        }
    }
    if (lat != undefined) {
        getData(tableid)
    } else {}
}

function toTitleCase(e) {
    return e.replace(/\w\S*/g, function(e) {
        if (e != "NY") {
            return e.charAt(0).toUpperCase() + e.substr(1).toLowerCase()
        } else return "NY"
    })
}

function ArrNoDupe(e) {
    var t = {};
    for (var n = 0; n < e.length; n++) t[e[n]] = true;
    var r = [];
    for (var i in t) r.push(i);
    return r
}

function clearMarkers() {
    for (var e = 0; e < markersArray.length; e++) {
        markersArray[e].setMap(null)
    }
    markersArray = []
}
$(function() {
    initialize();
});

function buildTable(e) {
    $("#table tbody").empty();
    var t = "#FF3300";
    var n = 0;
    var r = 0;
    var i;
    var s = [];
    var o;
    clearMarkers();
    for (var u in e) {
        if (e.hasOwnProperty(u)) {
            var a = e[u];
            if (marker) marker.setMap(null);
            id = a.id;
            address = a.address;
            mdaycarename = a.name;
            mcity = a.city;
            if (a.licensedby == "NYS") {
                mprofilelink = 'nys-daycare-profile.php?link=' + a.link + '&name=' + mdaycarename + '&address=' + address + '&city=' + mcity
            } else {
                mprofilelink = 'nyc-daycare-profile.php?link=' + a.link + '&name=' + mdaycarename + '&address=' + address + '&city=' + mcity
            }
            var f = a.lat;
            var l = a.long;
            loadMarker(n, f, l, address, mdaycarename, mprofilelink, t, id);
            var c = a.critdefs;
            var h = {};
            var p = 0;
            var d = "";
            var v = "";
            var m = "";
            for (var g in c) {
                h[c[g]] = (h[c[g]] || 0) + 1;
                if (h[c[g]] > p) {
                    p = h[c[g]];
                    d = c[g]
                }
            }
            if (d != "") s.push(d);
            p = 0;
            for (var g in c) {
                if (c[g] != d) {
                    h[c[g]] = (h[c[g]] || 0) + 1;
                    if (h[c[g]] > p) {
                        p = h[c[g]];
                        v = c[g]
                    }
                }
            }
            if (v != "") s.push(v);
            p = 0;
            for (var g in c) {
                if (c[g] != d && c[g] != v) {
                    h[c[g]] = (h[c[g]] || 0) + 1;
                    if (h[c[g]] > p) {
                        p = h[c[g]];
                        m = c[g]
                    }
                }
            }
            if (m != "") s.push(m);
            i = a.name.replace(/\s+/g, "");
            o = i + n;
            var y = toTitleCase(a.name);
            var x = toTitleCase(a.address);
            var z = toTitleCase(a.city)
            var w = a.licensedby;
            if (w == "NYS") {
                $("#table tbody").append('<tr id="' + o + '" relID= "' + n + '" relobj="' + u + '" class="aRow"><td class="">' + y + '</td><td>' + x + '</td><td>' + z + '</td><td><a href="nys-daycare-profile.php?link=' + a.link + '&name=' + y + '&address=' + x + '&city=' + z + '" target="_self">View profile</a></td></tr>')
            } else {
                $("#table tbody").append('<tr id="' + o + '" relID= "' + n + '" relobj="' + u + '" class="aRow"><td class="">' + y + '</td><td>' + x + '</td><td>' + z + '</td><td><a href="nyc-daycare-profile.php?link=' + a.link + '&name=' + y + '&address=' + x + '&city=' + z + '" target="_self">View profile</a></td></tr>')
            }
        }
        s = [];
        n++
    }
    var w = markersArray.length;
    if (w == 1) {
        $("#showing").html("Showing " + w + " result for: " + theAddress)
    } else {
        $("#showing").html("Showing " + w + " results for: " + theAddress)
    }
    var E = [
        [3, 0]
    ];
    $(".aRow").click(function() {
        var t = $(this).attr("relobj");
        var n = $(this).attr("relID");
    });
    $(".aRow").mouseover(function() {
        var e = $(this).attr("relID");
        var t = markersArray[e];
        growMarker(t)
    });
    $(".aRow").mouseout(function() {
        $(this).css({});
        var e = $(this).attr("relID");
        var t = markersArray[e];
        shrinkMarker(t)
    });
    $(".anIcon").mouseover(function() {
        $("#iconInfo").show();
        var e = $(this).attr("type");
        $("#iconInfo").html(iconDefs[e]);
        $(document).mousemove(function(e) {
            $("#iconInfo").css("top", e.pageY);
            $("#iconInfo").css("left", e.pageX - 120)
        })
    });
    $(".anIcon").mouseout(function() {
        $("#iconInfo").hide()
    })
}

function loadMarker(e, t, n, r, i, l, s, d) {
    var o = new google.maps.LatLng(t, n);
    var u = new google.maps.Marker({
        id: e,
        position: o,
        address: r,
        map: map,
        id: d,
        daycare: i,
        link: l,
        icon: getCircle(7, s)
    });
    markerList[u.id] = u;
    var a = markerClick(map, u, infoWindow);
    var f = markerOver(u);
    var l = markerOut(u);
    markersArray.push(markerList[u.id]);
    google.maps.event.addListener(u, "click", function() {
        window.open(u.link, "_self");
    });
    google.maps.event.addListener(u, "mouseover", f);
    google.maps.event.addListener(u, "mouseout", l)
}

function growMarker(e) {
    var t = e.get("icon");
    t.scale = 12;
    e.setZIndex(500);
    e.notify("icon")
}

function shrinkMarker(e) {
    var t = e.get("icon");
    t.scale = 7;
    e.setZIndex(200);
    e.notify("icon")
}

function getCircle(e, t) {
    var n = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: t,
        fillOpacity: 1,
        scale: e,
        strokeColor: "#ffffff",
        strokeWeight: .5
    };
    return n
}

function markerClick(e, t, n) {
    return function() {}
}

function markerOver(e) {
    var t = $("#table");
    var n;
    return function() {
        $("[relObj='" + e.id + "']").addClass("markerOn")
        var t = 0;
        var n = e.get("icon");
        n.scale = 12;
        e.setZIndex(500);
        e.notify("icon");
        $("#hoverBox").show();
        var r = toTitleCase(e.daycare);
        $("#hoverBox").html("<b>" + r + "</b><br />" + toTitleCase(e.address));
        $(document).mousemove(function(e) {
            $("#hoverBox").css("top", e.pageY);
            $("#hoverBox").css("left", e.pageX + 20)
        });
        $("[relObj='" + e.id + "']").css({
            "font-size": "1.8em",
            "font-weight": "normal"
        })
    }
}

function markerOut(e) {
    return function() {
        $("[relObj='" + e.id + "']").removeClass("markerOn")
        var t = e.get("icon");
        t.scale = 7;
        e.setZIndex(200);
        e.notify("icon");
        $("#hoverBox").hide();
        $("[relObj='" + e.id + "']").css({
            "font-size": "1.8em",
            "font-weight": "normal"
        })
    }
}

function centerMap(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        map.setZoom(11);
        var lat = results[0].geometry.location.lat();
        var lng = results[0].geometry.location.lng();
        if (marker) marker.setMap(null)
    }
}

function buildObj(e) {
    daycareArray = [];
    var t = [];
    var n = [];
    var i, s;
    myObj = {};
    var o = e.rows;
    if (o != undefined) {
        for (var u = 0; u < o.length; u++) {
            theAddress = o[u][4];
            if ($.inArray(o[u][4], daycareArray) === -1) {
                daycareArray.push(o[u][7]);
                myObj[theAddress] = {};
                myObj[theAddress].name = o[u][0];
                myObj[theAddress].address = o[u][1];
                myObj[theAddress].city = o[u][5];
                myObj[theAddress].zip = o[u][7];
                myObj[theAddress].link = o[u][8];
                myObj[theAddress].lat = o[u][2];
                myObj[theAddress].long = o[u][3];
                myObj[theAddress].licensedby = o[u][9];
            }
            var f = o[u][2];
        }
        var w = 0;
        var E = 0;
        for (var S = 0; S < t.length; S++) {
            w += t[S];
            E += n[S]
        }
        buildTable(myObj)
        if (searchType == "daycare") {
            geocoder.geocode({
                address: myObj[theAddress].address + "NYC",
                region: "ny"
            }, centerMap)
        } else {
            map.setZoom(15)
        }
    } else {}
}
$(document).ready(function() {}),
    function() {
        var e, t;
        e = this.jQuery || window.jQuery, t = e(window), e.fn.stick_in_parent = function(o) {
            var n, i, s, r, a, c, l, d, g, w;
            for (null == o && (o = {}), l = o.sticky_class, i = o.inner_scrolling, c = o.recalc_every, a = o.parent, r = o.offset_top, s = o.spacer, n = o.bottoming, null == r && (r = 0), null == a && (a = void 0), null == i && (i = !0), null == l && (l = "is_stuck"), null == n && (n = !0), d = function(o, d, g, w, p, u, f, h) {
                    var m, v, b, y, k, T, _, M, $, x, S;
                    if (!o.data("sticky_kit")) {
                        if (o.data("sticky_kit", !0), T = o.parent(), null != a && (T = T.closest(a)), !T.length) throw "failed to find stick parent";
                        if (m = b = !1, (x = null != s ? s && o.closest(s) : e("<div />")) && x.css("position", o.css("position")), _ = function() {
                                var e, t, n;
                                return !h && (e = parseInt(T.css("border-top-width"), 10), t = parseInt(T.css("padding-top"), 10), d = parseInt(T.css("padding-bottom"), 10), g = T.offset().top + e + t, w = T.height(), b && (m = b = !1, null == s && (o.insertAfter(x), x.detach()), o.css({
                                    position: "",
                                    top: "",
                                    width: "",
                                    bottom: ""
                                }).removeClass(l), n = !0), p = o.offset().top - parseInt(o.css("margin-top"), 10) - r, u = o.outerHeight(!0), f = o.css("float"), x && x.css({
                                    width: o.outerWidth(!0),
                                    height: u,
                                    display: o.css("display"),
                                    "vertical-align": o.css("vertical-align"),
                                    "float": f
                                }), n) ? S() : void 0
                            }, _(), u !== w) return y = void 0, k = r, $ = c, S = function() {
                            var e, a, v, M;
                            return !h && (null != $ && (--$, 0 >= $ && ($ = c, _())), v = t.scrollTop(), null != y && (a = v - y), y = v, b ? (n && (M = v + u + k > w + g, m && !M && (m = !1, o.css({
                                position: "fixed",
                                bottom: "",
                                top: k
                            }).trigger("sticky_kit:unbottom"))), p > v && (b = !1, k = r, null == s && ("left" !== f && "right" !== f || o.insertAfter(x), x.detach()), e = {
                                position: "",
                                width: "",
                                top: ""
                            }, o.css(e).removeClass(l).trigger("sticky_kit:unstick")), i && (e = t.height(), u + r > e && !m && (k -= a, k = Math.max(e - u, k), k = Math.min(r, k), b && o.css({
                                top: k + "px"
                            })))) : v > p && (b = !0, e = {
                                position: "fixed",
                                top: k
                            }, e.width = "border-box" === o.css("box-sizing") ? o.outerWidth() + "px" : o.width() + "px", o.css(e).addClass(l), null == s && (o.after(x), "left" !== f && "right" !== f || x.append(o)), o.trigger("sticky_kit:stick")), b && n && (null == M && (M = v + u + k > w + g), !m && M)) ? (m = !0, "static" === T.css("position") && T.css({
                                position: "relative"
                            }), o.css({
                                position: "absolute",
                                bottom: d,
                                top: "auto"
                            }).trigger("sticky_kit:bottom")) : void 0
                        }, M = function() {
                            return _(), S()
                        }, v = function() {
                            return h = !0, t.off("touchmove", S), t.off("scroll", S), t.off("resize", M), e(document.body).off("sticky_kit:recalc", M), o.off("sticky_kit:detach", v), o.removeData("sticky_kit"), o.css({
                                position: "",
                                bottom: "",
                                top: "",
                                width: ""
                            }), T.position("position", ""), b ? (null == s && ("left" !== f && "right" !== f || o.insertAfter(x), x.remove()), o.removeClass(l)) : void 0
                        }, t.on("touchmove", S), t.on("scroll", S), t.on("resize", M), e(document.body).on("sticky_kit:recalc", M), o.on("sticky_kit:detach", v), setTimeout(S, 0)
                    }
                }, g = 0, w = this.length; w > g; g++) o = this[g], d(e(o));
            return this
        }
    }.call(this), $("#map_canvas").stick_in_parent({
        bottoming: !1,
        offset_top: 51
    });
