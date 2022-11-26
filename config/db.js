if(process.env.NODE_ENV == 'production'){
    module.exports = {
        mongoURI: "mongodb+srv://tiagomendessilva:tiagomendessilva@aws-cluster-sp.7p3cpoe.mongodb.net/test"
    }
}else{
    module.exports = {
        mongoURI: "mongodb://localhost:27017/blogapp"
    }
}