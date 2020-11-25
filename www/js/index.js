/**
* Populate the database
*/
function populateDB(tx) {
    //create restaurants table
    tx.executeSql('DROP TABLE IF EXISTS restaurants');
    tx.executeSql('CREATE TABLE IF NOT EXISTS restaurants (restaurantID integer primary key not null, restaurantName text not null unique, restaurantType text, resPrice text, resService text, resClean text, resQual text, visitTime text, imageURI text)');
    //insert restaurant
    tx.executeSql('insert into restaurants(restaurantName, restaurantType, resPrice, resService, resClean, resQual, visitTime, imageURI) values ("Via Spohia", "Grill", "low", "nti", "okay","okay", "6PM 1/2/2020", "img/res1.png")');
    tx.executeSql('insert into restaurants(restaurantName, restaurantType, resPrice, resService, resClean, resQual, visitTime, imageURI) values ("Pinky Cafe", "Sea Food", "average", "good", "nti","excellent", "6PM 2/3/2020", "img/res2.png")');
    tx.executeSql('insert into restaurants(restaurantName, restaurantType, resPrice, resService, resClean, resQual, visitTime, imageURI) values ("Dorechester", "Grill", "high", "good", "good","excellent", "6PM 3/4/2020", "img/res3.png")');
    //create note table
    tx.executeSql('DROP TABLE IF EXISTS notes');
    tx.executeSql('CREATE TABLE IF NOT EXISTS notes (noteID integer primary key not null, noteDetails text not null,reviewerName text not null, restaurantID integer not null, foreign key (restaurantID) references restaurants (restaurantID) on update cascade on delete cascade)');
    //insert note
    tx.executeSql('insert into notes(noteDetails, reviewerName, restaurantID) values ("Lorem ipsum dolor sit amet", "Pham", 1)')
    tx.executeSql('insert into notes(noteDetails, reviewerName, restaurantID) values ("Lorem ipsum dolor sit amet", "Minh", 2)')
    tx.executeSql('insert into notes(noteDetails, reviewerName, restaurantID) values ("Lorem ipsum dolor sit amet", "Huy", 1)')
    tx.executeSql('insert into notes(noteDetails, reviewerName, restaurantID) values ("Lorem ipsum dolor sit amet", "Linh", 2)')
}

//Transaction error callback
//
function errorCB(tx, err) {
    console.log("Error processing SQL: " + err);
}

//Transaction sucess callback
//
function successCB() {
    console.log('DB transaction success');
}

//get restaurant data from db and assign to restaurant list
function renderAllRes(tx) {
    tx.executeSql('select * from restaurants', [], function (t, rs) {
        for (let i = 0; i < rs.rows.length; i++) {
            let { restaurantID, restaurantName, imageURI } = rs.rows.item(i);
            addRes(restaurantID, restaurantName, imageURI)
        }

        $("#restaurantList").listview('refresh')

        $(".showResDetails").on('click', function (e) {
            let resId = $(this).attr('res-id')
            $.mobile.changePage('#resDetails', { dataUrl: `/#resDetails?resId=${resId}` });
        })
    })
}

//convert rating from string to number 
function convertToNumber(rating) {
    switch (rating) {
        case "nti":
            return 1;
        case "okay":
            return 2;
        case "good":
            return 3;
        case "excellent":
            return 4;
    }
}

//calculate the average rating based on resService, resClean and resQual
function avgRating(resService, resClean, resQual) {
    let resServicetoNum = convertToNumber(resService)
    let resCleantoNum = convertToNumber(resClean)
    let resQualtoNum = convertToNumber(resQual)
    return Math.floor((resServicetoNum + resCleantoNum + resQualtoNum) / 3);
}

//picture API phonegap, see more at https://cordova.apache.org/docs/en/1.5.0/phonegap/camera/camera.getPicture.html
function getPicture() {
    navigator.camera.getPicture(getPictureSuccess, getPictureError, {
        resQual: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        correctOrientation: true
    })
}

//success picture callback
function getPictureSuccess(URI) {
    var img = document.getElementById('image');
    img.src = URI;
}

//error picture callback
function getPictureError(msg) {
    console.log("Picture Feature: " + msg);
}

//execute after new note added to database
function addNote(reviewerName, note) {
    $("#noteList").append(
        `<label for="user1">${reviewerName}</label>` +
        `<textarea name="user1" cols="40" rows="5" readonly>${note}</textarea>`
    )
}

//execute after new restaurant added to database
function addRes(resId, resName, imageURI) {
    $("#restaurantList").append(
        '<li data-theme="c">' +
        `<a class="showResDetails" data-transition="slide" res-id=${resId}>` +
        `<img src=${imageURI}>` +
        `<h2>${resName}</h2>` +
        '</a>' +
        '</li>'
    )
}


function saveNote(db, reviewerName, note, resId) {
    db.transaction(function (tx) {
        tx.executeSql(`insert into notes(noteDetails, reviewerName, restaurantID) values ("${note}", "${reviewerName}", "${resId}")`)
        addNote(reviewerName, note)
    }, errorCB, successCB)
}

//Cordova is ready
$(document).ready(function () {

    /**
    * Open Web SQL Database
    *
    * first param database_name.
    * second param database_version.
    * third param database_displayname.
    * fourth param database_size.
    */
    var db = window.openDatabase("[Database](../database/database.html)", "1.0", "Cordova Demo", 200000);

    db.transaction(populateDB, errorCB, successCB);

    //render all restaurants
    db.transaction(renderAllRes, errorCB, successCB)

    //render restaurant details
    $(document).on('pagebeforeshow', "#resDetails", function (e, d) {
        let param = window.location.href.split("?")[1]
        let resId = param.replace("resId=", "");
        db.transaction(function (tx) {
            tx.executeSql(`select * from restaurants left join notes on restaurants.restaurantID = notes.restaurantID where restaurants.restaurantID=${resId}`, [], function (t, rs) {
                $("#noteList").empty();
                for (let i = 0; i < rs.rows.length; i++) {
                    if (i == 0) {
                        let { resPrice, resQual, restaurantName, resService, resClean, restaurantType, visitTime, imageURI } = rs.rows.item(i)

                        $('.infoResName').text(restaurantName)
                        $('.infoResType').text(restaurantType)
                        $('.infoResPrice').text(`${resPrice}`)
                        $('.infoResRating').text(avgRating(resService, resClean, resQual))
                        $('.infoResVisit').text(visitTime)
                        $('#currentResId').val(resId)
                        $("#res-img").attr("src", imageURI)
                    }
                    let { reviewerName, noteDetails, noteID } = rs.rows.item(i)
                    if (noteID != null) {
                        addNote(reviewerName, noteDetails)
                    }
                }
            })

        }, errorCB, successCB)
    });

    $("#restaurantPhoto").on('click', function () {
        getPicture();
    })



    $("#newNoteForm").validate({
        rules:
        {
            reviewerName: {
                required: true
            },
            note: {
                required: true
            }
        },
        messages: {
            reviewerName: {
                required: "Required!",
            },
            note: {
                required: "Required!",
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (f) {
            let reviewerName = $('#newNoteForm input[name="reviewerName"]').val();
            let note = $('#newNoteForm textarea[name="note"]').val();
            let restaurantID = $("#currentResId").val()
            saveNote(db, reviewerName, note, restaurantID)

            //clear newNoteForm inputs
            $('#newNoteForm input[name="reviewerName"]').val("");
            $('textarea#new-note-textarea').val("");

            //close newNoteForm 
            $("#addnote").popup("close");

            return false;
        }
    });

    //custom validator 
    $.validator.addMethod("valueNotEquals", function (value, element, arg) {
        return arg !== value;
    }, "Value must not equal arg!");

    //delete on click
    $("#delResBtn").on("click", function () {
        let restaurantID = $("#currentResId").val()
        var aTagWithResID = document.querySelector(`a[res-id="${restaurantID}"]`);
        aTagWithResID.closest('li').remove();
        db.transaction(function (tx) {
            tx.executeSql(`delete from restaurants where restaurants.restaurantID=${restaurantID}`)
            tx.executeSql(`delete from notes where notes.restaurantID=${restaurantID}`)
        }, errorCB, successCB)
    })

    $("#newResForm").validate({
        rules:
        {
            reviewerName: {
                required: true
            },
            restaurantName: {
                required: true
            },
            visitTime: {
                required: true
            },
            visitDate: {
                required: true
            },
            restaurantPrice: {
                valueNotEquals: "default"
            },
            restaurantType: {
                valueNotEquals: "default"
            },
            restaurantService: {
                valueNotEquals: "default"
            },
            restaurantClean: {
                valueNotEquals: "default"
            },
            foodQuality: {
                valueNotEquals: "default"
            }
        },
        messages: {
            reviewerName: {
                required: "Your name required!",
            },
            restaurantName: {
                required: "Restaurant name required!",
            },
            visitTime: {
                required: "Visit time required!",
            },
            visitDate: {
                required: "Visit date required!",
            },
            restaurantPrice: {
                valueNotEquals: "Price required!",
            },
            restaurantType: {
                valueNotEquals: "Type required!"
            },
            restaurantService: {
                valueNotEquals: "Service rating required!"
            },
            restaurantClean: {
                valueNotEquals: "Cleanliness rating required!"
            },
            foodQuality: {
                valueNotEquals: "Food Quality rating required!"
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (f) {
            return false;
        }
    });

    $("#submitConfirmBtn").on('click', function () {
        if ($('#newResForm').valid()) {
            var reviewerName = $('#newResForm input[name="reviewerName"]').val();
            var restaurantName = $('#newResForm input[name="restaurantName"]').val();
            var restaurantType = $('#newResForm select[name="restaurantType"]').val();
            var restaurantService = $('#newResForm select[name="restaurantService"]').val();
            var restaurantClean = $('#newResForm select[name="restaurantClean"]').val();
            var foodQuality = $('#newResForm select[name="foodQuality"]').val();
            var visitTime = $('#newResForm input[name="visitTime"]').val();
            var visitDate = $('#newResForm input[name="visitDate"]').val();
            var resPrice = $('#newResForm select[name="restaurantPrice"]').val();

            $('.newReviewerName').text(reviewerName)
            $('.newResName').text(restaurantName)
            $('.newResType').text(restaurantType)
            $('.newResPrice').text(`${resPrice}`)
            $('.newResRating').text(avgRating(restaurantService, restaurantClean, foodQuality))
            $('.newResDay').text(`${visitTime + " " + visitDate}`)
            $("#popupSubmit").popup("open");
        }
    })

    $("#newResSubmit").on('click', function () {
        var reviewerName = $('#newResForm input[name="reviewerName"]').val();
        var restaurantName = $('#newResForm input[name="restaurantName"]').val();
        var restaurantType = $('#newResForm select[name="restaurantType"]').val();
        var restaurantService = $('#newResForm select[name="restaurantService"]').val();
        var restaurantClean = $('#newResForm select[name="restaurantClean"]').val();
        var foodQuality = $('#newResForm select[name="foodQuality"]').val();
        var visitTime = $('#newResForm input[name="visitTime"]').val();
        var visitDate = $('#newResForm input[name="visitDate"]').val();
        var resPrice = $('#newResForm select[name="restaurantPrice"]').val();
        var note = $('textarea#reviewerNote').val();
        var imageURI = $("#image").attr('src')

        db.transaction(function (tx) {
            tx.executeSql(`insert into restaurants(restaurantName, restaurantType, resPrice, resService, resClean, resQual, visitTime, imageURI) values ("${restaurantName}", "${restaurantType}", "${resPrice}", "${restaurantService}", "${restaurantClean}","${foodQuality}", "${visitTime + " " + visitDate}", "${imageURI}")`, [], function (tx, rs) {
                insertedResId = rs.insertId
            })
        }, function (){
            alert('Restaurant Name is already existed');
            $("#popupSubmit").popup("close");
        } 
        , function () {
            db.transaction(function (tx) {
                //if note exists, save it in the note table
                if (note != "") {
                    tx.executeSql(`insert into notes(noteDetails, reviewerName, restaurantID) values ("${note}", "${reviewerName}", ${insertedResId})`)
                }

                //append new restaurant in the restaurant list
                $("#restaurantList").append(
                    '<li data-theme="c">' +
                    `<a class="showResDetails" data-transition="slide" res-id=${insertedResId}>` +
                    `<img src=${imageURI}>` +
                    `<h2>${restaurantName}</h2>` +
                    '</a>' +
                    '</li>'
                )
                //refresh the restaurant list
                $('#restaurantList').listview("refresh")

                //add event to show detail button 
                $(".showResDetails").on('click', function (e) {
                    let resId = $(this).attr('res-id')
                    $.mobile.changePage('#resDetails', { dataUrl: `/#resDetails?resId=${resId}` });
                })

                //clear all inputs and image
                $('#newResForm input[name="reviewerName"]').val("");
                $('#newResForm input[name="restaurantName"]').val("");
                $('#newResForm input[name="visitTime"]').val("");
                $('#newResForm input[name="visitDate"]').val("");
                $('textarea#rnote').val("");
                $("#image").attr("src", "img/default-image.png")

                window.location.href = "#resListPage"
            }, errorCB, successCB)
        })
    })

    $("#updateResForm").validate({
        rules:
        {
            reviewerName: {
                required: true
            },
            restaurantName: {
                required: true
            },
            visitTime: {
                required: true
            },
            visitDate: {
                required: true
            },
            restaurantPrice: {
                valueNotEquals: "default"
            },
            restaurantType: {
                valueNotEquals: "default"
            },
            restaurantService: {
                valueNotEquals: "default"
            },
            restaurantClean: {
                valueNotEquals: "default"
            },
            foodQuality: {
                valueNotEquals: "default"
            }
        },
        messages: {
            reviewerName: {
                required: "Your name required!",
            },
            restaurantName: {
                required: "Restaurant name required!",
            },
            visitTime: {
                required: "Visit time required!",
            },
            visitDate: {
                required: "Visit date required!",
            },
            restaurantPrice: {
                valueNotEquals: "Price is required!",
            },
            restaurantType: {
                valueNotEquals: "Type is required!"
            },
            restaurantService: {
                valueNotEquals: "Service rating is required!"
            },
            restaurantClean: {
                valueNotEquals: "Service rating is required!"
            },
            foodQuality: {
                valueNotEquals: "Service rating is required!"
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (f) {
            var restaurantName = $('#updateResForm input[name="restaurantName"]').val();
            var restaurantType = $('#updateResForm select[name="restaurantType"]').val();
            var restaurantService = $('#updateResForm select[name="restaurantService"]').val();
            var restaurantClean = $('#updateResForm select[name="restaurantClean"]').val();
            var foodQuality = $('#updateResForm select[name="foodQuality"]').val();
            var visitTime = $('#updateResForm input[name="visitTime"]').val();
            var visitDate = $('#updateResForm input[name="visitDate"]').val();
            var resPrice = $('#updateResForm select[name="restaurantPrice"]').val();
            var restaurantID = $('#currentResId').val()

            db.transaction(function (tx) {
                tx.executeSql(`update restaurants set restaurantName="${restaurantName}", restaurantType="${restaurantType}", resPrice="${resPrice}", resService="${restaurantService}", resClean="${restaurantClean}", resQual="${foodQuality}", visitTime="${visitTime + " " + visitDate}" where restaurantID=${restaurantID}`, [], function (tx, rs) {
                    //clear all updateResForm inputs
                    $('#updateResForm input[name="reviewerName"]').val("");
                    $('#updateResForm input[name="restaurantName"]').val("");
                    $('#updateResForm input[name="visitTime"]').val("");
                    $('#updateResForm input[name="visitDate"]').val("");

                    //close updateResForm 
                    $("#edit-res").popup("close");

                    //update Restaurant Detail Screen
                    $('.infoResName').text(restaurantName)
                    $('.infoResType').text(restaurantType)
                    $('.infoResPrice').text(`${resPrice}`)
                    $('.infoResRating').text(avgRating(restaurantService, restaurantClean, foodQuality))
                    $('.infoResVisit').text(`${visitTime + " " + visitDate}`)

                    $("#restaurantList").empty();
                    db.transaction(renderAllRes, errorCB, successCB)
                })
            }, errorCB, successCB)
            return false;
        }
    });

});


