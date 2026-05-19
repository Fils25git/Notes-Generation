exports.handler = async (event) => {

try{

return {

statusCode:200,

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
success:true,
message:"Function is alive"
})

};

}
catch(error){

return {

statusCode:500,

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
success:false,
error:error.toString(),
stack:error.stack
})

};

}

};
