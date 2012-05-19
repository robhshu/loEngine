/*
  Light Object Engine (loEngine)
  
  Written by robhshu, May 2012
*/

function loEngine() {}
loEngine.prototype = 
{
  toString: function(){}
}

loEngine.typePolygon = "__loPolygon";
loEngine.typeCircle = "__loCircle";
loEngine.typeEllipse = "__loEllipse";

loEngine.typeLTest = "__loTestLightSource";
loEngine.typeLPoint = "__loPointLight";
loEngine.typeLDirectional = "__loDirLight";
loEngine.typeLSpot = "__loSpotLight";

/*****************   POLYGON CLASS   *****************/

function loPolygon() {}
loPolygon.prototype = 
{
  // Convert object to string
  toString: function()
  {
    return [
      "Type:",      this.type,
      "\nPos:",     this.pos,
      "\noRadius:", loRound( this.radius ),
      "\niRadius:", loRound( this.apothem() ),
      "\nSides:",   this.sides,
      "\nAngle:",   loRound( this.angle )
      //loRound( this.sidelen() )
    ].join(' ');
  },
  // Return a vertex at given position
  at: function( i )
  {   
    var p = this.pos.copy()
    p.addi( this.points[i%this.sides] );
    
    return p;
  },
  // Return angular midpoint (which falls on the container circumference)
  // This is useful for calculating line normals
  midApprox: function( i )
  {
    // Cap index and find angles
    i %= 360
    var a1 = this.angles[ i ]
    var a2 = this.angles[ ( i+1 < this.sides ? i+1 : 0 ) ]
    
    // Ensure a2 is greater than a1
    while( a1 > a2 )
      a2 += 360
    
    // Find the midpoint angle
    var mida = a1 + ( ( a2 - a1 ) / 2 )
    
    var ret = loPolygon.makeVertex
    (
      mida + this.angle,
      this.radius
    )
    
    return ret.add( this.pos )

  },
  midat2: function( i )
  {
    // Calculate the angle (assuming the angles are even)
    var ang = 360 / this.sides
    var off = 90 - ( ang/2 )
    
    var angleat = (ang * (i+0.5)) + off
    
    var tmp = loPolygon.makeVertex
    (
      angleat + this.angle,
      this.apothem()
    )
    
    return tmp.add( this.pos )
  },
  // Return the midpoint which falls between 2 existing points
  midat: function( i )
  {
    // more efficient than abs() and modulus
    i = ( i < this.sides && i >= 0 ? i : 0 );
    var j = ( i+1 < this.sides ? i+1 : 0 );
    
    var pi = this.points[i].copy()  // modified
    var pj = this.points[j]      // not modified
    
    pi.subi( pj )
    pi.x /= 2
    pi.y /= 2
    pi.addi( pj )
    pi.addi( this.pos )
    
    return( pi )
  },
  // Create the static points ( note: these points are not translated yet )
  update: function()
  {
    this.points = [];
    
    var i = 0;
    while( i < this.sides )
    {
      this.points.push(
        loPolygon.makeVertex
        (
          this.angles[i] + this.angle,
          this.radius
        )
      )
      ++i;
    }
  },
  rotate: function( deg )
  {
    this.angle = deg % 360;
    this.update();
  },
  apothem: function( )
  {
    // returns the radius of the inner-circle of a polygon
    // this gives the radius to any midpoint
    return this.radius * Math.cos( loAsRad( 180 / this.sides ) )
  },
  sidelen: function( )
  {
    // returns the length of any side of a regular poly
    return 2*this.radius*Math.sin( loAsRad( 180 / this.sides ) )
  }
}

loPolygon.makeVertex = function( deg, length )
{
  var rad = loAsRad( deg )
  
  return loPoint.create(
    Math.cos( rad ) * length,
    Math.sin( rad ) * length
  )
}

/*
  NOTE: angles are expected to be IN ORDER of size
  If you are unsure, call loPrepAngles on the angles
*/
loPolygon.create = function( x, y, radius, angles )
{
  if( angles.length > 2 )
  {
    var tmp = new loPolygon();
  
    tmp.type  = loEngine.typePolygon;
    tmp.pos   = loPoint.create( x, y )
    tmp.sides = angles.length;
    tmp.angles= angles;
    tmp.radius= radius;
    tmp.angle = 0;
  
    tmp.update();
  
    return tmp;
  }
}

/*
  loPrepAngles
    Ensure an array of angles is in ascending order of size
*/
loPrepAngles = function( arr )
{
  return arr.sort(function(a,b){return(a-b);})
}

/*
  loAsPoint
    Get the loPoint of any lighting object instance
*/
loAsPoint = function( loObj )
{
  return loPoint.create( loObj.x, loObj.y )
}

/*
  loCreatePoly
    Create an n-sided polypon
*/
loCreatePoly = function( x, y, radius, sides )
{
  return loPolygon.create( x, y, radius, loMakeNArray( sides ) );
}

loCreateTri = function( x, y, radius )
{
  return loCreatePoly( x, y, radius, 3 );
}

loCreateSquare = function( x, y, radius )
{
  return loCreatePoly( x, y, radius, 4 );
}

loCreatePentagon = function( x, y, radius )
{
  return loCreatePoly( x, y, radius, 5 );
}

loCreateHexagon = function( x, y, radius )
{
  return loCreatePoly( x, y, radius, 6 );
}

/*
  loCreateRect
    Special case of polygon. Here, the width and height parameters are just ratios
*/
loCreateRect = function( x, y, width, height, radius )
{
  //radius = 0.5 * Math.sqrt( width*width + height*height )
  var ah = loAsDeg( Math.atan( height/width ) )
 
  return loPolygon.create( x, y, radius, loPrepAngles([ -ah, ah, 180-ah, 180+ah ]) )
}

/*
  loMakeNArray
    Create an array of offsetted angles for loPolygon creation
*/
loMakeNArray = function( n )
{
  n = Math.abs( Math.round( n ) )
  var tmp = []
  var ang = 360 / n
  var off = 90 - ( ang/2 )
  
  var i = 0
  while( i < 360 )
  {
    tmp.push( i + off );
    i += ang
  }
  
  return tmp
}

/*****************    CIRCLE CLASS    *****************/

function loCircle() {}
loCircle.prototype = 
{
  toString: function( )
  {
    return [
      "Type:",      this.type,
      "\nPos:",     this.pos,
      "\nRadius:",  this.radius
    ].join(' ');
  },
  update: function( )
  {
  
  },
  rotate: function( deg )
  {
    // na
  },
  shadowing: function( loP )
  {
    // get distance of O-P (hyp)
    var d1 = loP.distance( this.pos )
    
    // no shadowing
    if( d1 < this.radius )
    {
      return []
    }
    // if distance < this.radius - ERROR!
    
    
    // the dist of O-T == the radius (adj)
    var d2 = this.radius
    
    // find the angle theta cos-1(a/h)
    var theta = loAsDeg( Math.acos( d2/d1 ) )
    
    // find the angle between the 
    var aoff = loAsDeg( loP.angle( this.pos ) )
    
    // create the new points with the known angles
    var v1 = loPolygon.makeVertex( -theta +aoff, this.radius )
    var v2 = loPolygon.makeVertex( theta  +aoff, this.radius )

    return [ v1,v2 ]
  }
}

loCircle.create = function( x, y, radius )
{
  var tmp = new loCircle();
  
  tmp.type = loEngine.typeCircle;
  tmp.pos = loPoint.create( x, y )
  tmp.radius = radius;
  tmp.angle = 0 // never rotated
  
  tmp.update();
  
  return tmp;
}

// Consistent naming style
loCreateCircle = function( x, y, radius )
{
  return loCircle.create( x, y, radius )
}

/*
  loEachVert
    Run anonymous function on vertices in a light object instance
*/
loEachVert = function( loObj, from, func )
{
  var i = from;
  while( i < loObj.points.length )
  {
    func( loObj.at( i ) );
    ++i;
  }
}


function loLayer() {}
loLayer.prototype = 
{
  toString: function()
  {
    return "loLayer"
  },
  // Assign one or many objects to this layer
  push: function( loObj )
  {
    if( loObj.constructor === Array )
      this.objects = this.objects.concat( loObj )
    else
      this.objects.push( loObj )
  },
  renderShadow: function( ctx, source )
  {
    var i = 0; var len = this.objects.length
    while( i < len )
    {
      if( this.objects[i].type === loEngine.typePolygon )
      {
        if( source.type === loEngine.typeLPoint )
          loDrawShadow( ctx, this.objects[i], source.pos )
        else if( source.type === loEngine.typeLTest )
        {
          // NOTE: passing the WHOLE object - not just the position
          // we need to call the shadowing() member of the source
          loDrawShadowEx( ctx, this.objects[i], source )
        }
      }
      else if( this.objects[i].type === loEngine.typeCircle )
      {
        if( source.type === loEngine.typeLPoint )
          loDrawShadowCirc( ctx, this.objects[i], source.pos )
      }
      ++i
    }
  },
  // Render all objects (NOTE: you can only draw in debug)
  render: function( ctx, debug )
  {
    var i = 0; var len = this.objects.length
    while( i < len )
    {
      debug ? loDrawDebug( ctx, this.objects[i] ) : loDraw( ctx, this.objects[i], "rgb(100,10,0)" );
      ++i
    }
  },
  clear: function()
  {
    this.objects = new Array()
  },
  eachObj: function( func )
  {
    var i = 0; var len = this.objects.length
    while( i < len )
    {
      func( this.objects[ i ] )
      ++i
    }
  }
}

loLayer.create = function( x, y )
{
  var tmp = new loLayer()
  tmp.pos = loPoint.create( x, y )
  tmp.objects = new Array()
  
  return tmp
}


function loWorld() {}
loWorld.prototype = 
{
  toString: function()
  {
    return "loWorld=[layers: " + this.layers.length + "]"
  },
  findLayer: function( lname )
  {
    var i = 0; var len = this.layers.length;
    while( i < len )
    {
      if( this.layers[i].name == lname )
        return this.getLayer( i )
      ++i
    }
  },
  getLayer: function( index )
  {
    var tmp = this.layers[ index ]
    if( tmp )
      return tmp.layer
  },
  newLayer: function( name )
  {
    var tmp = loLayer.create( 0, 0 )
    this.layers.push(
      {
        id: this.nextid,
        name: name,
        layer: tmp
      }
    )
    ++this.nextid
    return tmp
  },
  // Render each layer
  render: function( ctx, debug )
  {
    // Any layers?
    if( this.layers.length > 0 )
    {
      var lFirst = this.layers[0]
     
      // Check the first layer contains lights
      if( lFirst.name === "__lights" )
      {
        if( lFirst.layer.objects.length > 0 )
        {
          var lightObj = lFirst.layer.objects[0];
          
          loDrawLight( ctx, lightObj.pos )
          
          // render shadows together
          var i = 1;
          while( i < this.layers.length )
          {
            this.layers[i].layer.renderShadow( ctx, lightObj )
            ++i
          }
          
          // then render the objects ontop
          i = 1
          while( i < this.layers.length )
          {
            this.layers[i].layer.render( ctx, debug )
            ++i
          }
        }
        else
        {
          throw 'Lighting layer contains no lights';
        }
      }
      // Else, just render it
      else
      {
        lFirst.layer.render( ctx, debug )
      }
    }
  }
}

loWorld.create = function()
{
  var tmp = new loWorld()
  tmp.nextid = 0
  tmp.layers = new Array()
  tmp.newLayer( "__lights" );

  // push other stuff
  
  return tmp
}

var loContainer = loWorld.create();

function loEngineEvents() {}


loEngineEvents.prototype = 
{
  // worker function
  _tick: function( )
  {
    var i = 0; var len = this.elist.length
    while( i < len )
    {
      ele = this.elist[i]
      
      if( ele.a <= ele.t )
        ++ele.a;
      else
      {
        ele.f()
        ele.a = 0
      }
      
      ++i
    }
    
    me = this
    this.ehandle = setTimeout( function(){ me._tick(); }, this.interval );
  },
  // Call function at specified time
  // NEW: optional firstTick flag
  add: function( tickat, tickfun, firstTick )
  {
    this.elist.push(
      {
        a: firstTick === true ? tickat+1 : 0,
        t: tickat,
        f:tickfun
      }
    )
  },
  start: function( )
  {
    me = this
    this.ehandle = setTimeout( function(){ me._tick(); }, this.interval );
  },
  starti: function( )
  {
    this._tick()
  }
}

loEngineEvents.create = function()
{
  var tmp = new loEngineEvents()
  
  tmp.interval = 5
  
  tmp.elist = []  
  return tmp
}

function loLight() {}
loLight.prototype = 
{
  toString: function( )
  {
    return "loLight=[type: " + this.type + "]"
  }
}

loLight.create = function( x, y, type )
{
  var tmp = new loLight();
  tmp.type = type;
  tmp.pos = loPoint.create( x, y )

  return tmp
}

loCreatePointLight = function( x, y )
{
  return loLight.create( x, y, loEngine.typeLPoint );
}

loCreateTestLight = function( x, y )
{
  // create a circular light source
  var tmp = loCreateCircle( x, y, 50 )
  
  // override the loCircle type with light
  tmp.type = loEngine.typeLTest;
  
  return tmp;
}
