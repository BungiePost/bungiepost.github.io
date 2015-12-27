(function () {


    $('#searchUser').on('change', function () {
        var value = $(this).val();
    });

    $("#searchUser").autocomplete({
        source: function( request, response ) {
            $.ajax({
                type: 'GET',
                beforeSend: function (request) {
                    request.setRequestHeader("X-API-Key", '3eda8b18517c46c7bde4924f42562c40');
                },
                url: 'https://crossorigin.me/http://www.bungie.net/Platform/User/SearchUsers/?q=' + $("#searchUser").val(),
                success: function( data ) {
                    response(data.Response);
                }
            });
        },
        select: function (event, ui) {
            viewModel.searchForUser(ui.item.membershipId);
        },
        messages: {
            noResults: '',
            results: function () { }
        }
    }).data("ui-autocomplete")._renderItem = function (ul, item) {
        var image = "https://www.bungie.net" + item.profilePicturePath
        return $("<li style='background-color: black'>")
            .data("ui-autocomplete-item", item)
            .append("<img id='userAvatar' width='90' height='90' src='" + image + "'/><a id='" + item.membershipId + "'>" + item.displayName + "</a>").appendTo(ul);
    };

    $(".button-collapse").sideNav();

    function createDonut() {
        var data = [
        {
            value: viewModel.nonHelpCount,
            color: "#F7464A",
            highlight: "#FF5A5E",
            label: "Non #Help Posts"
        },
        {
            value: viewModel.helpCount,
            color: "#46BFBD",
            highlight: "#5AD3D1",
            label: "#Help posts"
        },
        ]

        var options = {
            //Boolean - Whether we should show a stroke on each segment
            segmentShowStroke: true,

            //String - The colour of each segment stroke
            segmentStrokeColor: "#fff",

            //Number - The width of each segment stroke
            segmentStrokeWidth: 2,

            //Number - The percentage of the chart that we cut out of the middle
            percentageInnerCutout: 50, // This is 0 for Pie charts

            //Number - Amount of animation steps
            animationSteps: 100,

            //String - Animation easing effect
            animationEasing: "easeOut",

            //Boolean - Whether we animate the rotation of the Doughnut
            animateRotate: true,

            //Boolean - Whether we animate scaling the Doughnut from the centre
            animateScale: false,

            //String - A legend template
            legendTemplate: "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%=segments[i].label%><%}%></li><%}%></ul>"

        };
        var ctx = $("#myChart").get(0).getContext("2d");
        var myPieChart = new Chart(ctx).Pie(data, options);

        // And for a doughnut chart
        var myDoughnutChart = new Chart(ctx).Doughnut(data, options);
    }


    var viewModel = kendo.observable({

        currentUser: "",
        currentUid: "",
        userAvatar: "",
        userBanner: "",
        currentUserAge: "",
        totalPosts: "",
        helpCount: 0,
        postIndex: 1,
        nonHelpCount: 0,
        posts: 0,
        responseList: [],
        postsWithTags: [],
        numberOfPages: 10,
        totalCount: 0,
        lastHelpPost: "",
        earliestHelpPost: "",


        postHistoryDS: new kendo.data.DataSource({
            data: [],
            schema: {
                data: function(data) {
                    return data;
                },
                model: {
                    fields: {
                        text: { field: "o.text", type: "string" },
                        dateposted: { field: "o.dateposted", type: "string" },
                        url: {field: "o.url", type: "string"}
                    }
                }
            },
            sort: { field: "dateposted", dir: "desc" }
        }),

        calculateAge: function(creationDate) {
            var a = new Date();
            var b = new Date(creationDate);
            var years = Math.round((a - b) / 31536000000);
            if (years < 1) {
                viewModel.set("currentUserAge", "Member for less than a year");
            } else {
                viewModel.set("currentUserAge", "Member for " + years + " years");
            }

        },

        searchForUser: function (uid) {

            var that = this;

            $.ajax({
                type: 'GET',
                beforeSend: function (request) {
                    request.setRequestHeader("X-API-Key", '3eda8b18517c46c7bde4924f42562c40');
                },
                url: 'https://crossorigin.me/http://www.bungie.net/Platform/User/GetBungieNetUserById/' + uid + '/',
                success: function (data, textStatus, request) {
                    that.set("currentUser", data.Response.displayName);
                    that.set("currentUid", "User ID: " + data.Response.membershipId);
                    that.set("userAvatar", 'https://www.bungie.net' + data.Response.profilePicturePath);
                    var bg = 'https://www.bungie.net/img/UserThemes/' + data.Response.profileThemeName + '/header.jpg';
                    $("#banner").css('background-image', 'url(' + bg + ')')
                    that.calculateAge(data.Response.firstAccess);
                    that.getPostHistory(uid);
                },
                error: function (request, textStatus, errorThrown) {
                    console.log(request);
                }
            })

        },
        
        getPostHistory: function (id) {
            var numberOfPages = parseInt(viewModel.numberOfPages);
            var counter = 0;
            var actualPosts = [];
            
            viewModel.postHistoryDS.data([]);
            console.log(actualPosts);
            console.log(viewModel.postHistoryDS.data());
            viewModel.responseList = [];
            for (var i = 1; i <= numberOfPages; i++) {
                $.ajax({
                    type: 'GET',
                    beforeSend: function (request) {
                        request.setRequestHeader("X-API-Key", '3eda8b18517c46c7bde4924f42562c40');
                    },
                    //url: 'https://www.bungie.net/Platform/Activity/User/' + id + '/Activities/LikeShareAndForum/?lc=en&fmt=true&lcin=true&itemsperpage=5&currentpage=' + i + '&format=0',
                    url: 'https://crossorigin.me/https://www.bungie.net/Platform/Activity/User/' + id + '/Activities/Forums/?lc=en&fmt=true&lcin=true&itemsPerPage=20&currentpage=' + i + '&format=0',
                    //url: 'http://www.bungie.net/Platform/Forum/GetPostAndParent/181112134/',             THIS GETS SPECIFIED POSTS
                    success: function (data, textStatus, request) {
                        counter++;
                        $.merge(viewModel.responseList, data.Response.posts);
                        if (counter == numberOfPages) {
                            for (var x = 0; x < viewModel.responseList.length; x++) {
                                if (viewModel.responseList[x].tags == undefined && viewModel.responseList[x].parentPostId != undefined) {
                                    var formattedItem = viewModel.responseList[x].body.replace(/(\r\n|\n|\r)/g, "<br/>");
                                    var removeFormatTags = formattedItem.replace(/\[.*\]/g, '');
                                    var item = {
                                        text: removeFormatTags,
                                        dateposted: viewModel.responseList[x].creationDate,
                                        url: 'https://www.bungie.net/en/Forum/Post/' + viewModel.responseList[x].parentPostId + '/0/0'
                                    }
                                    actualPosts.push(item);
                                }
                                if (viewModel.responseList[x].tags != undefined) {
                                    viewModel.postsWithTags.push(viewModel.responseList[x]);
                                }
                            }

                            viewModel.postHistoryDS.data(actualPosts);
                            viewModel.set("totalCount", actualPosts.length);
                            viewModel.calculateHelpPosts();
                            //createDonut();
                        }
                    },
                    error: function (request, textStatus, errorThrown) {
                        console.log(request);
                    }
                });
            }

        },


        calculateHelpPosts: function () {
            console.table(viewModel.postsWithTags)
            for (var i = 0; i < viewModel.postsWithTags.length; i++) {
                var item = {};
                var foundHelpTag = false;
                item = viewModel.postsWithTags[i];
                if (item.tags != undefined) {
                    for (var x = 0; x < item.tags.length; x++) {
                        if (item.tags[x] == "#Help") {
                            foundHelpTag = true;
                        }
                    }
                    if (foundHelpTag) {
                        viewModel.set("helpCount", viewModel.helpCount + 1);
                    } else {
                        viewModel.set("nonHelpCount", viewModel.nonHelpCount + 1);
                    }
                } else {

                }
            }
        }

    });

    kendo.bind($("#main"), viewModel);




})();
