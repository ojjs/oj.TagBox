// oj.TagBox.js

;(function(root, factory){

  // Export to Node, Require.JS, or globally
  if (typeof module === 'object' && module.exports) module.exports = factory(root)
  else if (typeof define === 'function' && define.amd) define(function(){return factory(root)})
  else factory(root, root.oj)

}(this, function(root, oj){

  var plugin = function(oj,settings){
    if (typeof settings !== 'object')
      settings = {}

    var Tag = oj.createType('Tag', {
      base: oj.ModelView,
      constructor: function(){
        var _t = this;
        var u = oj.unionArguments(arguments);
        var value = oj.argumentShift(u.options, 'value') || null;
        if (u.args.length > 0)
          value = u.args[0]
        var edit = oj.argumentShift(u.options, 'edit') || false;
        this.deleted = oj.argumentShift(u.options, 'deleted') || function(){}
        this.backspaced = oj.argumentShift(u.options, 'backspaced') || function(){}
        this.created = oj.argumentShift(u.options, 'created') || function(){}
        this.searched = oj.argumentShift(u.options, 'searched') || function(){}

        this.el = oj(function(){
          oj.div(function(){
            _t._label = oj.Text({c:'oj-Tag-label'});
            _t._x = oj.Text({c:'oj-Tag-x'}, 'x', {click:function(){
              _t.triggerDeleted()
            }});
            _t._input = oj.TextBox({c:'oj-Tag-input', live:true,
              keydown:function(e){
                // Backspace key pressed
                if(e.keyCode == 8) {
                  if(_t._input.value == "" && !_t._previousValue)
                    _t.triggerBackspaced()
                }
                // Enter key pressed and the input isn't empty
                else if(e.keyCode == 13) {
                  // Trigger on empty enters (searches)
                  if(_t._input.value == "") {
                    _t.triggerSearched()
                  // Trigger on creations
                  } else {
                    _t.edit = false
                    _t.triggerCreated()
                  }

                }
              },
              change:function(){
                // Remember previous value to detect backspaced event
                _t._previousValue = _t._input.value
                // Changes to input update the value of Tag
                _t._label.value = _t._input.value
              }
            });
          })
        });
        Tag.base.constructor.apply(this, [u.options]);

        this.edit = edit
        this.value = value || ""
      },
      properties:{
        isListItem:true,
        edit: {
          get:function(){return this._edit},
          set:function(v){
            this._edit = v;
            if(v)
              this.$el.addClass('edit')
            else
              this.$el.removeClass('edit')
          }
        },
        value: {
          get:function(){return this._value},
          set:function(v){
            this._value = v
            this._label.value = v
            this._input.value = v
          }
        },
        created:function(){},
        deleted:function(){},
        backspaced:function(){},
        searched:function(){}
      },
      methods:{
        triggerCreated:function(){
          if(oj.isFunction(this.created))
            this.created(this)
        },
        triggerDeleted:function(){
          this.$el.remove()
          if(oj.isFunction(this.deleted))
            this.deleted()
        },
        triggerBackspaced:function(){
          if(oj.isFunction(this.backspaced))
            this.backspaced()
        },
        triggerSearched:function(){
          if(oj.isFunction(this.searched))
            this.searched()
        },
        select:function(){
          this._input.$el.select()
        }
      }
    });

    // Tag CSS

    sharedFontSize = '14px'
    sharedFontFamily = 'Helvetica, sans-serif'
    sharedPadding = '0px 2px'

    Tag.css({
      '': {
        'list-style-type':'none',
        display:'inline-block',
        padding:'2px',
        border:'1px solid gray',
        borderRadius:'5px'
      },
      '> .oj-Tag-input':{
        display:'none',
        fontSize:sharedFontSize,
        fontFamily:sharedFontFamily,
        border:'1px solid red',
        outline:'none',
        padding:sharedPadding

      },
      '> .oj-Tag-label':{
        display:'inline-block',
        fontSize:sharedFontSize,
        fontFamily:sharedFontFamily,
        padding:sharedPadding
      },
      '> .oj-Tag-x':{
        display:'inline-block',
        fontFamily:'helvetica',
        fontWeight:'bold',
        margin:'0px 2px',
        cursor:'pointer',
        '&:hover': {
          fontWeight:'bolder'
        }
      },
      // When editing show input and hide the rest
      '&.edit':{
        '':{border:'none'},
        '> .oj-Tag-x':{display:'none'},
        '> .oj-Tag-label':{display:'none'},
        '> .oj-Tag-input':{display:'inline-block'}
      }
    })

    var TagBox = oj.createType('TagBox', {

      base: oj.CollectionView,

      // TagBox(tag1, tag2, tag3, properties)
      constructor: function(){
        var _t = this;
        var u = oj.unionArguments(arguments);
        var options = u.options;
        var args = u.args;

        // First argument is video id
        if(args.length > 0)
          this.video = args[0];

        var tags = oj.argumentShift(options, 'tags') || []

        // The element is a list of Tag views.
        this.el = oj(function(){
          _t._tags = oj.List({
            // Select the last input on click
            click:function(){
              _t._selectInput()
            }
          });
        });

        TagBox.base.constructor.apply(this, [options]);

        // .value: an array of strings (same as .tags)
        this.tags = args.length > 0 ? args : tags;
      },
      properties: {
        tags: {
          get: function(){
            return this._tags.items;
          },
          set: function(v){
            if(!oj.isArray(v))
              throw new Error('oj.TagBox.value: expected array')
            var _t = this;
            _t._tags.clear()
            v.forEach(function(tag){
              _t._addTag(tag)
            })
            _t._addInputTag()
            _t._selectInput()
          }
        },
        text: {
          get: function(){ return this._input.value },
          set: function(v){ this._input.value = v }
        },
        // Value is .tags
        value: {
          get: function(){ return this.tags },
          set: function(v){ this.tags = v }
        },
        count: {
          get: function(){ return this._tags.count }
        },
        "$inputs": {
          get: function(){ return this.$('.oj-TagBox-input') }
        },
        "tagObjects": {
          get: function(){ return this.$('li.oj-Tag').ojValues() }
        },
        "$dropdowns": {
          get: function(){ return this.$('.oj-TagBox-dropdown') }
        },
        "$box":{
          get: function(){ return this.$el }
        }
      },
      methods: {
        // add: function(tagData){
        //   var v = this.value;
        //   this._addTag(tagData)
        //   // this._tagCreated()
        // },
        // remove: function(ix, tagName){
        // },
        // clear: function(){
        //   this._tags.clear()
        //   this._tagDeleted()
        // },
        make: function(){
        },
        // Event: tagCreated was fired
        _tagCreated: function(){
          console.log("tagCreated");
          this._addInputTag()
          this._selectInput()
        },
        // Event: tagDeleted was fired
        _tagDeleted: function(){
          console.log("tagDeleted");
        },
        // Event: tagBackspaced was fired
        _tagBackspaced: function(){
          // Remove the second to last if it exists
          if(this._tags.count >= 2)
            this._tags.remove(-2)
        },
        // Add a tag with event bindings
        _addTag: function(tag, options){
          var _t = this;
          events = {
            created:function(){_t._tagCreated.apply(_t, arguments)},
            deleted:function(){_t._tagDeleted.apply(_t, arguments)},
            backspaced:function(){_t._tagBackspaced.apply(_t, arguments)}
          };
          _t._tags.add(new Tag(tag, events, options))
        },
        // Add an input tag at the end
        _addInputTag: function(tag){
          this._addTag(tag, {edit:true})
        },
        // Select the last input
        _selectInput: function(){
          this._tags.item(-1).select();
        }
      }
    });

    TagBox.Tag = Tag;

    // TagBox.theme('default', {
    //   '':{
    //     backgroundColor:'white',
    //     border:'1px solid orange'
    //   }
    // })

    TagBox.css({
      '':{
        display:'block',
        position:'relative',
        backgroundColor:'white',
        border:'1px solid #c6c6c6',
        boxShadow: '-1px -1px 0px 0px #ddd',
        padding:'5px 5px 0 5px',
        minHeight:'25px',
        overflow:'auto',
        '> .oj-Tag':{
          float:'left',
          margin:'0 5px 5px 0',
          padding:0,
        }
      }
    })

    return {TagBox:TagBox};
  };

  // Export to OJ
  if (typeof oj != 'undefined')
    oj.use(plugin);

  return plugin;
}));


