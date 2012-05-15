/*
	Lighting object engine (loEngine) v0.4
	BY robhshu, 2012

	info:
		this engine uses cyclic polygons for ease of simple 2d transformations
		read more at: http://en.wikipedia.org/wiki/Cyclic_polygon
*/

/*
	loAsDeg
		Convert radians to degrees
*/
loAsDeg = function( rad )
{
	return( rad * 180/Math.PI );
}

/*
	loAsRad
		Convert degrees to radians
*/
loAsRad = function( deg )
{
	return( deg * Math.PI/180 );
}

function loVec2() {}
loVec2.prototype = 
{
	toString: function( )
	{
		return "loVec2=( " + this.i + "i, " + this.j + "j )";
	},
	copy: function( )
	{
		return loVec2.create( this.i, this.j )
	},
	addi: function( v )
	{
		this.i += v.i
		this.j += v.j
	},
	add: function( v )
	{
		var tmp = this.copy()
		tmp.addi( v )
		return tmp
	},
	subi: function( v )
	{
		this.i -= v.i
		this.j -= v.j
	},
	sub: function( v )
	{
		var tmp = this.copy()
		tmp.subi( v )
		return tmp
	},
	normalize: function( amm )
	{
		var len = this.length();
		if( len != 0 )
		{
			this.i /= len
			this.j /= len
			
			if( amm )
			{
				this.i *= amm;
				this.j *= amm;
			}
		}
	},
	length: function( )
	{
		return Math.sqrt( this.i*this.i + this.j*this.j )
	},
	dirx: function( )
	{
		return Math.acos( this.i / this.length() )
	},
	diry: function( )
	{
		return Math.acos( this.j / this.length() )
	},
	dot: function( v )
	{
		return( this.i*v.i + this.j*v.j )
	},
	angle: function( v )
	{
		var d = this.dot( v )
		
		// vectors are perpendicular to one another
		if( d == 0 ) return 90;
		
		return loAsDeg( Math.acos( d / ( this.length() * v.length() ) ) )
	},
	asPoint: function( )
	{
		return loPoint.create( this.i, this.j )
	}
}

/*
	Create loVec2 between 2 points
*/
loVec2.create = function( i,j )
{
	var tmp = new loVec2()
	
	tmp.i = i
	tmp.j = j
	
	return tmp
}

loMakeVec2 = function( p1, p2 )
{
	return loVec2.create( p2.x-p1.x, p2.y-p1.y )
}

function loPoint() {}
loPoint.prototype = 
{
	toString: function( )
	{
		return "loPoint=[ x: " + this.x + ", y: " + this.y + " ]";
	},
	// Duplicate current instance
	copy: function( )
	{
		return loPoint.create( this.x, this.y )
	},
	// Copy sum to new instance
	add: function( loP )
	{
		var tmp = this.copy();
		tmp.addi( loP );
		return tmp;
	},
	// Sum immedate
	addi: function( loP )
	{
		this.x += loP.x
		this.y += loP.y
	},
	// Copy subtraction to new instance
	sub: function( loP )
	{
		var tmp = this.copy();
		tmp.subi( loP );
		return tmp;
	},
	// Subtract immedate
	subi: function( loP )
	{
		this.x -= loP.x;
		this.y -= loP.y;
	},
	negate: function( )
	{
		this.x = -this.x;
		this.y = -this.y;
	},
	// Normalize with optional length
	normalize: function( amm )
	{
		var len = this.length();
		if( len != 0 )
		{
			this.x /= len
			this.y /= len
			
			if( amm )
			{
				this.x *= amm;
				this.y *= amm;
			}
		}
	},
	// Radians between points - TODO: REMOVE THIS
	angle: function( loP )
	{
		var p = this.sub( loP )
		return Math.atan2( p.y, p.x )
	},
	// Distance between points
	distance: function( loP )
	{
		var p = this.sub( loP )
		return p.length()
	},
	// Modulus
	length: function( )
	{
		return Math.sqrt( this.x*this.x + this.y*this.y )
	},
	project: function( loP, amm )
	{
		var tmp = this.copy()
		tmp.normalize( amm )
		tmp.addi( loP )
		return tmp
	}
};

loPoint.create = function(x,y)
{
	var tmp = new loPoint();
	tmp.x = x;
	tmp.y = y;
	return tmp;
}

loOrigin = function( )
{
	return loPoint.create( 0, 0 )
}

function loPolygon() {}
loPolygon.prototype = 
{
	toString: function()
	{
		return "loPolygon=[ x: " + this.x
				+ ", y: " + this.y
				+ ", sides: " + this.sides 
				+ ", angle: " + Math.round(this.angle)
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
		this.length = Math.sqrt( this.width*this.width+ this.height*this.height );
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
		this.angle = deg;
		this.update();
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
	
		tmp.x = x;
		tmp.y = y;
		tmp.sides = angles.length;
		tmp.angles = angles;
		
		if( radius.constructor === Array )
		{
			tmp.width = radius[0];
			tmp.height= radius[1];
		}
		else
		{
			tmp.width = tmp.height = radius;
		}

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

loCreateTri = function( x, y, radius )
{
	return loPolygon.create( x, y, radius, loMakeNArray(3) );
}

loCreateSquare = function( x, y, radius )
{
	return loPolygon.create( x, y, radius, loMakeNArray(4) );
}

loCreatePentagon = function( x, y, radius )
{
	return loPolygon.create( x, y, radius, loMakeNArray(5) );
}

loCreateHexagon = function( x, y, radius )
{
	return loPolygon.create( x, y, radius, loMakeNArray(6) );
}

loCreateRect = function( x, y, width, height, confine )
{
	var rsize = Math.sqrt( width*width + height*height );
	
	// for width, use cos, for height, use sin
	var ah = loAsDeg( Math.acos( width / rsize ) )
	
	if( confine === true )
	{
		width = width / rsize * width
		height = height/ rsize * height
	}
	
	// todo: set angles in order of size
	
	return loPolygon.create( x, y, [width,height], loPrepAngles([ -ah, ah, 180-ah, 180+ah ]) );
}

/*
	loConfine
		Limit the radius to the circular container
*/
loConfine = function( r )
{
	if( r == 0 )
		return 1

	var len = Math.sqrt( r*r + r*r )
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

loDrawDebug = function( ctx, loObj )
{
	if( !loObj.points )
	{
		// draw container circle
		ctx.strokeStyle = "rgb(200,200,200)";
		loDraw( ctx, loObj, "rgb(180,180,180)" )
		ctx.stroke()
		
		// draw midpoints
		ctx.strokeStyle = "rgb(100,100,100)";
		ctx.beginPath();
		ctx.arc(
			loObj.x,
			loObj.y,
			1,
			0,
			2*Math.PI,
			false
		)
		ctx.stroke()
	}
	else
	{
		// draw object
		loDraw( ctx, loObj, "rgb(180,180,180)" )
		
		// draw lines to midpoints
		var i = 0;
		while( i < loObj.sides )
		{
			// pass1
			ctx.strokeStyle = "rgb(200,200,200)";
			ctx.beginPath();
			var c = loAsPoint( loObj );
			ctx.moveTo( c.x, c.y )
			var a = loObj.midApprox( i )
			ctx.lineTo( a.x, a.y )
			ctx.stroke();
		
			// pass2
			ctx.strokeStyle = "rgb(100,100,100)";
			ctx.beginPath();
			var c = loAsPoint( loObj );
			ctx.moveTo( c.x, c.y )
			var a = loObj.midat( i )
			ctx.lineTo( a.x, a.y )
			ctx.stroke();
			
			++i
		}
		
		// draw container circle
		ctx.strokeStyle = "rgb(200,200,200)";
		ctx.beginPath();
		ctx.arc(
			loObj.x,
			loObj.y,
			loObj.length,
			0,
			2*Math.PI,
			false
		)
		ctx.stroke()
	}
}

/*
	loDraw
		Draw light object on rendering context
*/
loDraw = function( ctx, loObj, style )
{
	ctx.fillStyle = style;
	ctx.beginPath();
	
	if( !loObj.points )
	{
		ctx.arc(
			loObj.x,
			loObj.y,
			loObj.radius,
			0,
			2*Math.PI,
			false
		)
	}
	else
	{
		// Use member function to return the first static point
		var p = loObj.at( 0 )
		ctx.moveTo( p.x, p.y );
		
		loEachVert(
			loObj,
			1,
			function( loP )
			{
				ctx.lineTo( loP.x, loP.y );
			}
		);
		
		ctx.lineTo( p.x, p.y );
		ctx.closePath();
	}
	
	ctx.fill();
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

// v0.6
//

function loWorld() {} // made up of loLayers, indexable
loWorld.prototype = 
{
	toString: function()
	{
		return "undefined"
	},
	addLayer: function( loL )
	{
		// check layer name is not already in use, then
		this.layers.push( loL )
	},
	// Returns layer name
	getLayer: function( i )
	{
		return this.layers[i].name
	},
	// Get a level by name
	get: function( )
	{
	
	}
}

/*
	TODO: Object containers:
	
	World [has] Layers [has] (loCircle or loPolygons) and lights (todo)
*/


loWorld.create = function()
{
	var tmp = new loWorld()
	tmp.layers = []
	return tmp
}

/*
	toString
	clone
	addPoly( loObj, z )  z index is important to rendering order
	remPoly
	getPoly
*/

function loLayer() {}
loLayer.create = function( name )
{
	var tmp = new loLayer()
	tmp.name = name
	return tmp
}

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
	// Call function at specified time: NOTE: 100 is one second
	add: function( tickat, tickfun )
	{
		this.elist.push({a: 0, t: tickat, f:tickfun})
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

