exports.handler = async (event) => {

console.log("Function started");

try {

return {

statusCode: 200,

headers: {
"Content-Type":"application/json"
},

body: JSON.stringify({
success:true,
message:"addStudent is running"
})

};

}
catch(error){

console.log("ERROR:", error);

return {

statusCode:500,

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
success:false,
error:error.message
})

};

}

};
