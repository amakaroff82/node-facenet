var __w = 640;
var __h = 480;

Webcam.set({
  width: __w,
  height: __h,
  image_format: 'jpeg',
  jpeg_quality: 70
});

Webcam.attach( '#my_camera' );

var users = [];
var lastFaces = [];
var color = ["red", "blue", "green", "pink", "cian", "orange"]

var canvas = document.getElementById('layer');
canvas.addEventListener("click", saveUser);
var ctx = canvas.getContext('2d');

function updateTracking(items) {
  lastFaces = items;

  checkFaces(items);

  ctx.fillStyle = 'rgba(225,225,225,1.0)';
  ctx.clearRect(0, 0, __w, __h);

  for(var i = 0; i < items.length; i++){
    var item = items[i];
    var pos = item.location;

    ctx.beginPath();
    ctx.strokeSize="1";

    ctx.fillStyle = 'rgba(0,0,255,1.0)';
    ctx.fillRect(pos.x, pos.y - 24, pos.w, 24);
    ctx.font = "14px Arial";
    ctx.fillStyle = 'rgba(255,255,225,1.0)';
    ctx.fillText(item.name, pos.x + 4, pos.y - 6);
    //

    if(item.landmark && item.landmark.leftEye && item.landmark.rightEye) {
      ctx.arc(item.landmark.leftEye.x, item.landmark.leftEye.y, 3, 0, 2 * Math.PI, false);
      ctx.arc(item.landmark.rightEye.x, item.landmark.rightEye.y, 3, 0, 2 * Math.PI, false);
      ctx.stroke();
    }

    ctx.strokeStyle=color[i];
    ctx.rect(pos.x, pos.y - 24, pos.w, pos.h);
    ctx.stroke();
    ctx.closePath();
  }
}

function FromBase64(str) {
  return atob(str).split('').map(function (c) { return c.charCodeAt(0); });
}


function checkFaces(faces) {
  for (var i = 0; i < faces.length; i++) {
    var face = faces[i],
      acceptableUser = null,
      minRes = 1.0;
    for (var j = 0; j < users.length; j++) {
      var user = users[j];
      var res = match(face.embedding, user.embedding);
      if (res < minRes) {
        minRes = res;
        acceptableUser = user;
      }
    }
    if (acceptableUser) {
      face.name = acceptableUser.name;
      face._user = acceptableUser;
    } else {
      face.name = "Unknown user";
    }
  }
}

function match(e1, e2){
  var res = 0.0;
  for(var i = 0; i < 128; i++){
    res += ((e1[i] - e2[i]) ** 2);
  }
  return Math.sqrt(res);
}

function saveUser(src, evt) {
  var rect = src.target.getBoundingClientRect();
  var pos = {
    x: src.clientX - rect.left,
    y: src.clientY - rect.top
  };

  var newUser = null;

  for(var i = 0; i < lastFaces.length; i++){
    var l = lastFaces[i].location;
    if(l.x < pos.x && pos.x < (l.x + l.w) &&
      l.y < pos.y && pos.y < (l.y + l.h) )
    {
      var name = prompt('Enter Name for a new user', lastFaces[i].name);
      if(name) {
        var user = {
          name: name,
          embedding: lastFaces[i].embedding
        };

        if(lastFaces[i]._user){
          lastFaces[i]._user.name = name;
        }
        else{
          users.push(user);
        }

        localStorage.users = JSON.stringify(users);
      }
    }
  }
}

//function newUser()

function startStream() {
  Webcam.snap( function(data_uri) {
    const payload = {
      command: 1,
      image: data_uri
    }
    const myRequest = new Request('/api', {method: 'POST', body: JSON.stringify(payload)});
    fetch(myRequest).then(response => {
      if (response.status === 200) {
      response.json().then((res)=>{
        if(res && res.length){
        updateTracking(res);
      } else {
        updateTracking([]);
      }


      startStream();
    });

    } else {
      throw new Error('Something went wrong on api server!');
    }
  }).catch(error => {
      console.error(error);
  });
  } );
}

if(localStorage.users){
  users = JSON.parse(localStorage.users);
}

Webcam.on('load', function(){
  console.log('Start stream');
  setTimeout(function(){
    startStream();
  }, 200)
})
