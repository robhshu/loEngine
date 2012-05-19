/*
	Light Object Math (loMath)
	
	Written by robhshu, May 2012
	v0.0	Split math into seperate module
*/

/*
	loAsDeg
		Convert radians to degrees
*/
loAsDeg = function( rad )
{
	return( rad * 57.2957795 );
}

/*
	loAsRad
		Convert degrees to radians
*/
loAsRad = function( deg )
{
	return( deg * 0.0174532925 );
}

/*
	loRound
		Round a number to 3SF
*/
loRound = function( x )
{
	return Math.round( x * 1000 ) / 1000
}

/*
  loRandom
    Return a whole random number ( 0 - n )
*/
loRand = function( n )
{
  return Math.round( Math.random() * n )
}

/*
	loVec2
		2D vector class
*/
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

loVec2.create = function( i,j )
{
	var tmp = new loVec2()
	
	tmp.i = i
	tmp.j = j
	
	return tmp
}

/*
	loMakeVec2
		Create loVec2 from points
*/
loMakeVec2 = function( p1, p2 )
{
	return loVec2.create( p2.x-p1.x, p2.y-p1.y )
}

/*
	loPoint
		2D point class
*/
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

/*
	loOrigin
		Central point
*/
loOrigin = function( )
{
	return loPoint.create( 0, 0 )
}
