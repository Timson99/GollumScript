var util = require('util')
var HashMap = require('hashmap').HashMap

module.exports = function (program) {
  gen(program)  
}

var indentPadding = 4
var indentLevel = 0

function emit(line) {
  var pad = indentPadding * indentLevel
  console.log(Array(pad+1).join(' ') + line)
}

function makeOp(op) {
  return {not: '!', and: '&&', or: '||', '==': '===', '!=': '!=='}[op] || op
}

var makeVariable = (function () {
  var lastId = 0
  var map = new HashMap()
  return function (v) {
    if (!map.has(v)) map.set(v, ++lastId)
    return '_v' + map.get(v)
  }
}())

function gen(e) {
  return generator[e.constructor.name](e)
}

var generator = {

  'Script': function (program) {
    indentLevel = 0
    emit('(function () {')
    gen(program.block)
    emit('}());')
  },

  'Block': function (block) {
    indentLevel++
    block.statements.forEach(function (statement) {
      gen(statement)
    })
    indentLevel--
  },

  'BasicVar': function (v) {
    //console.log(v.id)
   // var id = v.id ?gen(v.id) : 'undefined' 
    return v.referent
  },

  'VarDec': function (v) {
    var value = v.value ? gen(v.value) : 'undefined' 
    emit(util.format('var %s = %s;', makeVariable(v.id), value))
  },

  'Ifes': function (v) {
    for (var i = 0; i < v.conditions.length; i++) {
      if (i === 0) {
        emit('if (' + gen(v.conditions[i]) + ') {')
        gen(v.body)
        emit('}')
      }
      else {
        emit('else if'+ gen(v.conditions[i]) + ') {')
        gen(v.body)
        emit('}')
      }
    }
  },

  'FuncDec': function (d) {
    emit(util.format('function %s (%s) {', makeVariable(d.name), d.parameters.parameters.join(',')))
    gen(d.body)
    emit('}')
  },

  'Assignment': function (s) {
    emit(util.format('%s = %s;', gen(s.target), gen(s.source)))
  },

  'Printes': function (s) {
    emit(util.format('alert(%s);', gen(s.expression)))
  },

  'givesUs': function (s) {
    emit(util.format('return %s;', gen(s.expression)))
  },

  'Revolves': function (s) {
    emit('while (' + gen(s.condition) + ') {')
    gen(s.body)
    emit('}')
  },

  'Whiles': function (s) {
    emit('while ' + gen(s.condition) + ' {')
    gen(s.body)
    emit('}')
  },

 'DottedVar': function (v) {
    return util.format('%s.%s', gen(v.struct), gen(v.property))
  },

  'IntegerLiteral': function (literal) {
    return literal.toString()
  },

  'StringLiteral': function (literal) {
    return literal.toString()
  },

  'BooleanLiteral': function (literal) {
    return literal.toString()
  },

  'VariableReference': function (v) {
    return makeVariable(v.referent)
  },

  'UnaryExpression': function (e) {
    return util.format('(%s %s)', makeOp(e.op.lexeme), gen(e.operand))
  },

  'BinaryExpression': function (e) {
     //console.log(e.left.constructor.name)
      //console.log(e.left)
      //console.log(e.left.name.constructor.name)// This should be an ID and not a String FIX
    return util.format('(%s %s %s)', gen(e.left), makeOp(e.op.lexeme), gen(e.right))
  }
}