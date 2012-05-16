/*
	Light Object Engine (loEngine)
	
	Written by robhshu, May 2012

	info:
		this engine uses cyclic polygons for ease of simple 2d transformations
		NOTE: only regular polygons tested
		
		read more at: http://en.wikipedia.org/wiki/Cyclic_polygon
*/

function loPolygon() {}
loPolygon.prototype = 
{
	toString: function()
	{
		return "loPolygon=[ x: " 	+ loRound( this.x )
				+ ", y: " 			+ loRound( this.y )
				+ ", sides: " 		+ loRound( this.sides )
				+ ", angle: " 		+ loRound( this.angle )
				+ ", circumradius: "+ loRound( this.length )
				+ ", apothem: " 	+ loRound( this.apothem() )
				+ ", side length: " + loRound( this.sidelen() )
				+ " ]";
	},
	// Return a vertex at given position
	at: function( i )
	{
		i = ( i < this.sides && i >= 0 ? i : 0 )
		
		var p = loAsPoint( this )
		p.addi( this.points[i] );
		
		return p;
	},
	// Return angular midpoint (which falls on the container circumference)
	// This is useful for calculating line normals
	midApprox: function( i )
	{
		// cap value i
		i = ( i < this.sides && i >= 0 ? i : 0 )
		
		var a1 = this.angles[ i ]
		var a2 = this.angles[ ( i+1 < this.sides ? i+1 : 0 ) ]
		
		// bugfix for when a2 > a1
		while( a1 > a2 )
			a2 += 360
		
		// calculate the midpoint angle
		var mida = a1 + ( ( a2 - a1 ) / 2 )
		
		var ret = loPolygon.makeVertex
		(
			mida + this.angle,
			this.length
		)
		
		return ret.add( loAsPoint( this ) )
	
	},
	// Return the midpoint which falls between 2 existing points
	midat: function( i )
	{
		// more efficient than abs() and modulus
		i = ( i < this.sides && i >= 0 ? i : 0 );
		var j = ( i+1 < this.sides ? i+1 : 0 );
		
		var pi = this.points[i].copy()	// modified
		var pj = this.points[j]			// not modified
		
		pi.subi( pj )
		pi.x /= 2
		pi.y /= 2
		pi.addi( pj )
		pi.addi( loAsPoint( this ) )
		
		return( pi )
	},
	// Update the values which use the size
	doResize: function( )
	{
		//find the hyp
		this.length = Math.sqrt( this.radius*this.radius*2 );
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
					this.length
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
		return this.length * Math.cos( loAsRad( 180 / this.sides ) )
	},
	sidelen: function( )
	{
		// returns the length of any side of a regular poly
		return 2*this.length*Math.sin( loAsRad( 180 / this.sides ) )
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
	
		// Centroid
		tmp.x = x;
		tmp.y = y;
		// n-sided poly
		tmp.sides = angles.length;
		tmp.angles = angles;
		tmp.radius = radius; // just using radius now
		tmp.angle = 0;
	
		tmp.doResize();
		tmp.update();
	
		return tmp;
	}
}

/*
	loPrepAngles
		Ensure angles are in order of size - use this when you are unsure
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
	0.6
		These preset polygons functions now strictly use the radius as the circumradius
*/
loCreateTri = function( x, y, radius, useout )
{
	return loPolygon.create( x, y, loConfine( radius ), loMakeNArray(3) );
}

loCreateSquare = function( x, y, radius, useout )
{
	return loPolygon.create( x, y, loConfine( radius ), loMakeNArray(4) );
}

loCreatePentagon = function( x, y, radius, useout )
{
	return loPolygon.create( x, y, loConfine( radius ), loMakeNArray(5) );
}

loCreateHexagon = function( x, y, radius, useout )
{
	return loPolygon.create( x, y, loConfine( radius ), loMakeNArray(6) );
}

/*
	Rectangles are a special case in that the width/height is only really the
	ratio between parallel sides
*/
loCreateRect = function( x, y, width, height, radius )
{
	// Sides are parallel, so this angle can be used to calculate the other four
	var ah = loAsDeg( Math.atan( height/width ) )
	
	return loPolygon.create( x, y, loConfine( radius ), loPrepAngles([ -ah, ah, 180-ah, 180+ah ]) )
}


/*
// todo convert points to cyclic poly
// todo try to create from quadrilateral points
	// ( width*2 + height*2 ) * 0.5;
*/

/*
	loConfine
		Limit the radius to the circular container
*/
loConfine = function( r )
{
	if( r == 0 )
		return 1

	var len = Math.sqrt( r*r*2 )
	return r / len * r
}

/*
	loMakeNArray
		Create an array of angles for loPolygon creation
		v0.3:
			shape is rotated to offset the canvas orientation of 90deg
*/
loMakeNArray = function( n )
{
	n = Math.abs( Math.round( n ) )
	var tmp = []
	var ang = 360 / n
	var i = 0
	var off = 90 - ( ang/2 )
	
	while( i < 360 )
	{
		tmp.push( i + off );
		i += ang
	}
	
	return tmp
}

function loCircle() {}
loCircle.prototype = 
{
	toString: function( )
	{
		return "loCircle=[ x: " + this.x + ", y: " + this.y + ", radius: " + this.radius + " ]";
	},
	doResize: function( )
	{
		
	},
	update: function( )
	{
	
	},
	shadowing: function( loP )
	{
		// get distance of O-P (hyp)
		var d1 = loP.distance( loAsPoint( this ) )
		
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
		var aoff = loAsDeg( loP.angle( loAsPoint( this ) ) )
		
		// create the new points with the known angles
		var v1 = loPolygon.makeVertex( -theta +aoff, this.radius )
		var v2 = loPolygon.makeVertex( theta  +aoff, this.radius )
//		alert( v )
		return [ v1,v2 ]
	}
}

loCircle.create = function( x, y, radius )
{
	var tmp = new loCircle();
	
	tmp.x = x;
	tmp.y = y;
	tmp.radius = radius;
	
	tmp.doResize();
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
	// Render all objects (NOTE: you can only draw in debug)
	render: function( ctx, debug )
	{
		var i = 0; var len = this.objects.length
		while( i < len )
		{
			debug === true ? loDrawDebug( ctx, this.objects[i] ) : loDraw( ctx, this.objects[i], "rgba(0,0,0,0.5)" )
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
		this.layers.push(
			{
				id: this.nextid,
				name: name,
				layer: loLayer.create( 0, 0 )
			}
		)
		++this.nextid
	}
}

loWorld.create = function()
{
	var tmp = new loWorld()
	tmp.nextid = 0
	tmp.layers = new Array()
	tmp.newLayer( "__lights" );
	tmp.newLayer( "Layer 1" );

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

