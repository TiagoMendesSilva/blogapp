const express = require('express')
const router = express.Router()

//Usar um model de forma externa dentro do moongose - Importa moongose -> chama arquivo do model -> chama a função que passa uma referência do seu model para uma variável
const mongoose = require('mongoose')
require('../models/Categoria')
const Categoria = mongoose.model('categorias')

require('../models/Postagem')
const Postagem = mongoose.model('postagens')

const {eAdmin} = require("../helpers/eAdmin")

router.get('/', eAdmin, (req,res) => {
    //renderizar uma view que está dentro index
    res.render('admin/index')
    
})

router.get('/categories', eAdmin, (req,res) => {
    //visualizar as categorias. Sem o método lean não estava mostrando os dados. 
    //Ativar o lean() diz ao mongoose pular a instanciação do documento e fornecer apenas POJO
    //o método sort faz listar pelo campo data
    Categoria.find().sort({date:'desc'}).lean().then((categorias) => {
        res.render('admin/categories',{categorias: categorias})
    }).catch((err) => {
        req.flash('error_msg',"Houve um erro ao listar as categorias")
        res.redirect('admin')
    })
    
})

router.get('/categories/add', eAdmin, (req,res) => {
    res.render('admin/addCategories')
})

//esses valores nome e slug fazem referência aos campos name e slug do arquivo addCategories.handlebars
//slug é link para a categoria
router.post('/categories/new', eAdmin, (req,res) => {

    var erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome inválido"})
    }
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({texto: "Slug inválido"})
    }

    if(req.body.nome.length < 2){
        erros.push({
            texto: "Nome da categoria muito pequeno"
        })
    }
    //se tiver erro, renderizar a view com o objeto erros -> dentro da view vamos chamar a estrutura each
    if(erros.length > 0){
        res.render('admin/addCategories',{erros: erros})
    }else{
        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug
    
        }
        new Categoria(novaCategoria).save().then(() => {
            //Para exibir essas mensagens é necessário criar view em partials 
            req.flash('success_msg',"Categoria criada com sucesso")
            console.log("Categoria salva com sucesso! e redireciona página de categorias")
            res.redirect('/admin/categories')
        }).catch((error) => {

            req.flash('error_msg', "Houve um erro ao salvar a categoria, tente novamente!")
            console.log("Erro ao salvar categoria! e redireciona para a página admin" + error)
            res.redirect('/admin')
        })
    }
})

//Na view de categorias criar um botão 
//Redirecionar a uma rota e pegar o id dinamicamente
router.get('/categories/edit/:id', eAdmin, (req,res) => {
    //Buscar o id que seja passado como parâmetro e no método  then vai passar a categoria para a view
    //E caso não tenha achado a categoria fazer um catch() chamando o flash e indicando que a categoria não existe
    //E redirecionar para a página de categorias
    //Para capturar os dados da categoria registrada na view colocar o atributo value="{{categoria.nome}}..."
    //O método lean() solucionou o carregamento dos dados para a página de edição
    Categoria.findOne({_id:req.params.id}).lean().then((categoria) => {
        res.render('admin/editCategories',{categoria: categoria})
    }).catch((err) => {
        req.flash('error_msg',"Esta categoria não existe "+err)
        res.redirect('admin/categories')
    })

})

//Rota que submete a alteração
//Na view editCategories adicionar <input type="hidden" name="id" value="{{categoria._id}}"
//Dentro do findOne vai procurar um post que tenha id igual ao id que foi passado no formulário
//Na view de editCategories mudar a action
router.post("/categories/edit", eAdmin, (req,res) => {
    Categoria.findOne({_id: req.body.id}).then((categoria) => {
        categoria.nome = req.body.nome
        categoria.slug = req.body.slug

        categoria.save().then(() => {
            req.flash("success_msg","categoria editada com sucesso!")
            res.redirect('/admin/categories')
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno ao salvar a edição da categoria")
            res.redirect('/admin/categories')
        })

    }).catch((err) => {
        req.flash('error_msg', "Houve um erro ao editar categoria: "+err)
        res.redirect('/admin/categories')
    })
})

router.post("/categories/delete", eAdmin, (req,res) => {
    Categoria.remove({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Categoria deletada com sucesso!")
        res.redirect('/admin/categories')
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao deletar categoria "+err)
        res.redirect('/admin/categories')
    })
})

router.get("/posts", eAdmin, (req,res) => {

    Postagem.find().populate('categoria').sort({date:"desc"}).lean().then((postagens) => {
        res.render('admin/posts', {postagens:postagens})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar posts")
        res.redirect('admin')
    })
    
})

//Na linha 130 as categorias estão sendo enviadas para a view
//Na view criar um label para selecionar todas as categorias, fazendo um foreach e mostrando as opções
router.get('/posts/add', eAdmin, (req,res) => {
    Categoria.find().lean().then((categorias) => {
        res.render('admin/addPost',{categorias: categorias})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar formulário "+err)
        res.redirect('admin')
    })
    
})

router.post('/posts/new', eAdmin, (req,res) => {

    //Validar se a categoria que o usuario enviou tem o valor 0
    var erros = []
    if(req.body.categoria == "0"){
        erros.push({texto: "Categoria inválida, registre uma categoria"})
    }
    if(erros.length > 0){
        res.render('admin/addPost', {erros: erros})
    }else{

        //Carregar o model de post e adicionar o post

        const newPost = {
            titulo: req.body.titulo,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria,
            slug: req.body.slug
        }

        new Postagem(newPost).save().then(() => {
            req.flash("success_msg", "Postagem criado com sucesso!")
            res.redirect('/admin/posts')
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao salvar a postagem "+ err)
            res.redirect('/admin/posts')
        })

    }


})

router.get('/posts/edit/:id', eAdmin, (req,res) => {

    //Pesquisar pela postagem
    Postagem.findOne({_id: req.params.id}).lean().then((postagem) => {
        
        //Pesquisar pela categoria e renderizar os dados das categorias e a postagem e para visualizar os campos na página de edição adicionar o atributo value ="{{posts.title}}"
        Categoria.find().lean().then((categorias) => {
            res.render('admin/editPosts', {categorias:categorias, postagem:postagem})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao buscar categoria para edição "+err)
            res.redirect('admin/posts')
        })
       
    }).catch((err) => {
        rew.flash("error_msg", "Houve um erro ao carregar o formulário de edição "+err)
        res.redirect('admin/posts')
    })

    
})

router.post('/posts/edit', eAdmin, (req,res) => {
    
    //Atualizar a postagem e estamos pesquisando por uma postagem que tem o id igual ao id passado no formulário
    Postagem.findOne({_id: req.body.id}).then((postagem) => {

        postagem.titulo = req.body.titulo
        postagem.slug = req.body.slug
        postagem.descricao = req.body.conteudo
        postagem.conteudo = req.body.conteudo
        postagem.categoria = req.body.categoria

        postagem.save().then(() => {
            req.flash("success_msg", "Postagem editada com sucesso!")
            res.redirect('/admin/posts')

        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao atualizar postagem "+err)
            res.redirect('/admin/posts')
        })

    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao salvar a edição "+err)
        res.redirect('/admin/posts')
    })
})

router.post('/posts/delete', eAdmin, (req,res) => {

    Postagem.remove({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Postagem deletada com sucesso!")
        res.redirect('/admin/posts')

    }).catch((err) => {
        req.flash("error_msg", "Erro ao deletar postagem: "+err)
        res.redirect('/admin/posts')

    })
})


module.exports = router