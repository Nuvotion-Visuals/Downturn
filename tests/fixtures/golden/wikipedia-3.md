# Hermitian matrix - Wikipedia
In mathematics, a **Hermitian matrix** (or **self-adjoint matrix**) is a [complex](http://fakehost/wiki/Complex_number%20%22Complex%20number%22) [square matrix](http://fakehost/wiki/Square_matrix%20%22Square%20matrix%22) that is equal to its own [conjugate transpose](http://fakehost/wiki/Conjugate_transpose%20%22Conjugate%20transpose%22)—that is, the element in the i\-th row and j\-th column is equal to the [complex conjugate](http://fakehost/wiki/Complex_conjugate%20%22Complex%20conjugate%22) of the element in the j\-th row and i\-th column, for all indices i and j:

![{\displaystyle A{\text{ Hermitian}}\quad \iff \quad a_{ij}={\overline {a_{ji}}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/28a0aaa74b2267a48312e19321211cd9e3a39228)

or in matrix form:

![{\displaystyle A{\text{ Hermitian}}\quad \iff \quad A={\overline {A^{\mathsf {T}}}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/6ca00b61ff0e264e6c1e5adc9a00c0d2751feecf).

Hermitian matrices can be understood as the complex extension of real [symmetric matrices](http://fakehost/wiki/Symmetric_matrix%20%22Symmetric%20matrix%22).

If the [conjugate transpose](http://fakehost/wiki/Conjugate_transpose%20%22Conjugate%20transpose%22) of a matrix ![A](https://wikimedia.org/api/rest_v1/media/math/render/svg/7daff47fa58cdfd29dc333def748ff5fa4c923e3) is denoted by ![{\displaystyle A^{\mathsf {H}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/d9415702ab196cc26f5df37af2d90e07318e93df), then the Hermitian property can be written concisely as

![{\displaystyle A{\text{ Hermitian}}\quad \iff \quad A=A^{\mathsf {H}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/291d260bf69b764e75818669ab27870d58771e1f)

Hermitian matrices are named after [Charles Hermite](http://fakehost/wiki/Charles_Hermite%20%22Charles%20Hermite%22), who demonstrated in 1855 that matrices of this form share a property with real symmetric matrices of always having real [eigenvalues](http://fakehost/wiki/Eigenvalues_and_eigenvectors%20%22Eigenvalues%20and%20eigenvectors%22). Other, equivalent notations in common use are ![{\displaystyle A^{\mathsf {H}}=A^{\dagger }=A^{\ast }}](https://wikimedia.org/api/rest_v1/media/math/render/svg/8aa270391d183478251283d2c4b2c72ac4563352), although note that in [quantum mechanics](http://fakehost/wiki/Quantum_mechanics%20%22Quantum%20mechanics%22), ![A^{\ast }](https://wikimedia.org/api/rest_v1/media/math/render/svg/5541bfa07743be995242c892c344395e672d6fa2) typically means the [complex conjugate](http://fakehost/wiki/Complex_conjugate%20%22Complex%20conjugate%22) only, and not the [conjugate transpose](http://fakehost/wiki/Conjugate_transpose%20%22Conjugate%20transpose%22).

Alternative characterizations\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=1%20%22Edit%20section:%20Alternative%20characterizations%22)\]
------------------------------------------------------------------------------------------------------------------------------------------------

Hermitian matrices can be characterized in a number of equivalent ways, some of which are listed below:

### Equality with the adjoint\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=2%20%22Edit%20section:%20Equality%20with%20the%20adjoint%22)\]

A square matrix ![A](https://wikimedia.org/api/rest_v1/media/math/render/svg/7daff47fa58cdfd29dc333def748ff5fa4c923e3) is Hermitian if and only if it is equal to its [adjoint](http://fakehost/wiki/Hermitian_adjoint%20%22Hermitian%20adjoint%22), that is, it satisfies

![{\displaystyle \langle w,Av\rangle =\langle Aw,v\rangle ,}](https://wikimedia.org/api/rest_v1/media/math/render/svg/459de45e76bace9d04a80d2e8efc2abbbc246047)

for any pair of vectors ![v,w](https://wikimedia.org/api/rest_v1/media/math/render/svg/6425c6e94fa47976601cb44d7564b5d04dcfbfef), where ![{\displaystyle \langle \cdot ,\cdot \rangle }](https://wikimedia.org/api/rest_v1/media/math/render/svg/9a50080b735975d8001c9552ac2134b49ad534c0) denotes [the inner product](http://fakehost/wiki/Dot_product%20%22Dot%20product%22) operation.

This is also the way that the more general concept of [self-adjoint operator](http://fakehost/wiki/Self-adjoint_operator%20%22Self-adjoint%20operator%22) is defined.

### Reality of quadratic forms\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=3%20%22Edit%20section:%20Reality%20of%20quadratic%20forms%22)\]

A square matrix ![A](https://wikimedia.org/api/rest_v1/media/math/render/svg/7daff47fa58cdfd29dc333def748ff5fa4c923e3) is Hermitian if and only if it is such that

![{\displaystyle \langle v,Av\rangle \in \mathbb {R} ,\quad v\in V.}](https://wikimedia.org/api/rest_v1/media/math/render/svg/997ea0350c18735926412de88420ac9ca989f50c)

### Spectral properties\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=4%20%22Edit%20section:%20Spectral%20properties%22)\]

A square matrix ![A](https://wikimedia.org/api/rest_v1/media/math/render/svg/7daff47fa58cdfd29dc333def748ff5fa4c923e3) is Hermitian if and only if it is unitarily [diagonalizable](http://fakehost/wiki/Diagonalizable_matrix%20%22Diagonalizable%20matrix%22) with real [eigenvalues](http://fakehost/wiki/Eigenvalues_and_eigenvectors%20%22Eigenvalues%20and%20eigenvectors%22).

Applications\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=5%20%22Edit%20section:%20Applications%22)\]
--------------------------------------------------------------------------------------------------------------

Hermitian matrices are fundamental to the quantum theory of [matrix mechanics](http://fakehost/wiki/Matrix_mechanics%20%22Matrix%20mechanics%22) created by [Werner Heisenberg](http://fakehost/wiki/Werner_Heisenberg%20%22Werner%20Heisenberg%22), [Max Born](http://fakehost/wiki/Max_Born%20%22Max%20Born%22), and [Pascual Jordan](http://fakehost/wiki/Pascual_Jordan%20%22Pascual%20Jordan%22) in 1925.

Examples\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=6%20%22Edit%20section:%20Examples%22)\]
------------------------------------------------------------------------------------------------------

In this section, the conjugate transpose of matrix ![A](https://wikimedia.org/api/rest_v1/media/math/render/svg/7daff47fa58cdfd29dc333def748ff5fa4c923e3) is denoted as ![{\displaystyle A^{\mathsf {H}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/d9415702ab196cc26f5df37af2d90e07318e93df), the transpose of matrix ![A](https://wikimedia.org/api/rest_v1/media/math/render/svg/7daff47fa58cdfd29dc333def748ff5fa4c923e3) is denoted as ![{\displaystyle A^{\mathsf {T}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/54bf0331204e30cba9ec7f695dfea97e6745a7c2) and conjugate of matrix ![A](https://wikimedia.org/api/rest_v1/media/math/render/svg/7daff47fa58cdfd29dc333def748ff5fa4c923e3) is denoted as ![{\displaystyle {\overline {A}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/92efef0e89bdc77f6a848764195ef5b9d9bfcc6a).

See the following example:

![{\displaystyle {\begin{bmatrix}2&2+i&4\\2-i&3&i\\4&-i&1\\\end{bmatrix}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/00ccf11c16396b6ddd4f2254f7132cd8bb2c57ee)

The diagonal elements must be [real](http://fakehost/wiki/Real_number%20%22Real%20number%22), as they must be their own complex conjugate.

Well-known families of [Pauli matrices](http://fakehost/wiki/Pauli_matrices%20%22Pauli%20matrices%22), [Gell-Mann matrices](http://fakehost/wiki/Gell-Mann_matrices%20%22Gell-Mann%20matrices%22) and their generalizations are Hermitian. In [theoretical physics](http://fakehost/wiki/Theoretical_physics%20%22Theoretical%20physics%22) such Hermitian matrices are often multiplied by [imaginary](http://fakehost/wiki/Imaginary_number%20%22Imaginary%20number%22) coefficients,[\[1\]](#cite_note-1)
[\[2\]](#cite_note-2) which results in _skew-Hermitian_ matrices (see [below](#facts)).

Here, we offer another useful Hermitian matrix using an abstract example. If a square matrix ![A](https://wikimedia.org/api/rest_v1/media/math/render/svg/7daff47fa58cdfd29dc333def748ff5fa4c923e3) equals the [multiplication of a matrix](http://fakehost/wiki/Matrix_multiplication%20%22Matrix%20multiplication%22) and its conjugate transpose, that is, ![{\displaystyle A=BB^{\mathsf {H}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/3f0efab2d7c3a4b4b7caf14cc0705dadd13195a9), then ![A](https://wikimedia.org/api/rest_v1/media/math/render/svg/7daff47fa58cdfd29dc333def748ff5fa4c923e3) is a Hermitian [positive semi-definite matrix](http://fakehost/wiki/Positive_semi-definite_matrix%20%22Positive%20semi-definite%20matrix%22). Furthermore, if ![B](https://wikimedia.org/api/rest_v1/media/math/render/svg/47136aad860d145f75f3eed3022df827cee94d7a) is row full-rank, then ![A](https://wikimedia.org/api/rest_v1/media/math/render/svg/7daff47fa58cdfd29dc333def748ff5fa4c923e3) is positive definite.

Properties\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=7%20%22Edit%20section:%20Properties%22)\]
----------------------------------------------------------------------------------------------------------



*   The entries on the [main diagonal](http://fakehost/wiki/Main_diagonal%20%22Main%20diagonal%22) (top left to bottom right) of any Hermitian matrix are [real](http://fakehost/wiki/Real_number%20%22Real%20number%22).

_Proof:_ By definition of the Hermitian matrix

![{\displaystyle H_{ij}={\overline {H}}_{ji}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4fa8265c5f6d4fc3b7cda6a06558c7d4d9aec855)

so for _i_ = _j_ the above follows.

Only the [main diagonal](http://fakehost/wiki/Main_diagonal%20%22Main%20diagonal%22) entries are necessarily real; Hermitian matrices can have arbitrary complex-valued entries in their [off-diagonal elements](http://fakehost/wiki/Off-diagonal_element%20%22Off-diagonal%20element%22), as long as diagonally-opposite entries are complex conjugates.

*   A matrix that has only real entries is Hermitian [if and only if](http://fakehost/wiki/If_and_only_if%20%22If%20and%20only%20if%22) it is [symmetric](http://fakehost/wiki/Symmetric_matrix%20%22Symmetric%20matrix%22). A real and symmetric matrix is simply a special case of a Hermitian matrix.

_Proof:_ ![{\displaystyle H_{ij}={\overline {H}}_{ji}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4fa8265c5f6d4fc3b7cda6a06558c7d4d9aec855) by definition. Thus H_ij_ = H_ji_ (matrix symmetry) if and only if ![{\displaystyle H_{ij}={\overline {H}}_{ij}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/0f1862750b96d01100244370b3fca45f01923ce5) (H_ij_ is real).

*   Every Hermitian matrix is a [normal matrix](http://fakehost/wiki/Normal_matrix%20%22Normal%20matrix%22). That is to say, AAH = AHA.

_Proof:_ A = AH, so AAH = AA = AHA.

*   The finite-dimensional [spectral theorem](http://fakehost/wiki/Spectral_theorem%20%22Spectral%20theorem%22) says that any Hermitian matrix can be [diagonalized](http://fakehost/wiki/Diagonalizable_matrix%20%22Diagonalizable%20matrix%22) by a [unitary matrix](http://fakehost/wiki/Unitary_matrix%20%22Unitary%20matrix%22), and that the resulting diagonal matrix has only real entries. This implies that all [eigenvalues](http://fakehost/wiki/Eigenvectors%20%22Eigenvectors%22) of a Hermitian matrix A with dimension n are real, and that A has n linearly independent [eigenvectors](http://fakehost/wiki/Eigenvector%20%22Eigenvector%22). Moreover, a Hermitian matrix has [orthogonal](http://fakehost/wiki/Orthogonal%20%22Orthogonal%22) eigenvectors for distinct eigenvalues. Even if there are degenerate eigenvalues, it is always possible to find an [orthogonal basis](http://fakehost/wiki/Orthogonal_basis%20%22Orthogonal%20basis%22) of ℂ_n_ consisting of n eigenvectors of A.

*   The sum of any two Hermitian matrices is Hermitian.

_Proof:_ ![{\displaystyle (A+B)_{ij}=A_{ij}+B_{ij}={\overline {A}}_{ji}+{\overline {B}}_{ji}={\overline {(A+B)}}_{ji},}](https://wikimedia.org/api/rest_v1/media/math/render/svg/251bf4ebbe3b0d119e0a7d19f8fd134c4f072971) as claimed.

*   The [inverse](http://fakehost/wiki/Inverse_matrix%20%22Inverse%20matrix%22) of an invertible Hermitian matrix is Hermitian as well.

_Proof:_ If ![{\displaystyle A^{-1}A=I}](https://wikimedia.org/api/rest_v1/media/math/render/svg/021893240ff7fa3148b6649b0ba4d88cd207b5f0), then ![{\displaystyle I=I^{H}=(A^{-1}A)^{H}=A^{H}(A^{-1})^{H}=A(A^{-1})^{H}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/a28a8250ab35ad60228bb0376eb4b7024f027815), so ![{\displaystyle A^{-1}=(A^{-1})^{H}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/a0179c3a7aebe194ccd9a19ba02b972500f88a7a) as claimed.

*   The [product](http://fakehost/wiki/Matrix_multiplication%20%22Matrix%20multiplication%22) of two Hermitian matrices A and B is Hermitian if and only if _AB_ = _BA_.

_Proof:_ Note that ![{\displaystyle (AB)^{\mathsf {H}}={\overline {(AB)^{\mathsf {T}}}}={\overline {B^{\mathsf {T}}A^{\mathsf {T}}}}={\overline {B^{\mathsf {T}}}}{\overline {A^{\mathsf {T}}}}=B^{\mathsf {H}}A^{\mathsf {H}}=BA.}](https://wikimedia.org/api/rest_v1/media/math/render/svg/b6cf8185ca7a0687bf959bb65b16db6cf1714ca2) Thus ![{\displaystyle (AB)^{\mathsf {H}}=AB}](https://wikimedia.org/api/rest_v1/media/math/render/svg/d303a1ebcac8547489b170be5d0dd7d8e04e548e) [if and only if](http://fakehost/wiki/If_and_only_if%20%22If%20and%20only%20if%22) ![AB=BA](https://wikimedia.org/api/rest_v1/media/math/render/svg/992c8ea49fdd26b491180036c5a4d879fec77442).

Thus _A__n_ is Hermitian if A is Hermitian and n is an integer.

*   The Hermitian complex n\-by-n matrices do not form a [vector space](http://fakehost/wiki/Vector_space%20%22Vector%20space%22) over the [complex numbers](http://fakehost/wiki/Complex_number%20%22Complex%20number%22), ℂ, since the identity matrix _I__n_ is Hermitian, but _i_ _I__n_ is not. However the complex Hermitian matrices _do_ form a vector space over the [real numbers](http://fakehost/wiki/Real_numbers%20%22Real%20numbers%22) ℝ. In the 2_n_2\-[dimensional](http://fakehost/wiki/Dimension_of_a_vector_space%20%22Dimension%20of%20a%20vector%20space%22) vector space of complex _n_ × _n_ matrices over ℝ, the complex Hermitian matrices form a subspace of dimension _n_2. If _E__jk_ denotes the n\-by-n matrix with a 1 in the _j_,_k_ position and zeros elsewhere, a basis (orthonormal w.r.t. the Frobenius inner product) can be described as follows:

![{\displaystyle E_{jj}{\text{ for }}1\leq j\leq n\quad (n{\text{ matrices}})}](https://wikimedia.org/api/rest_v1/media/math/render/svg/46eedb181c0bdae46e8c1526161b03d0ea97b4b4)

together with the set of matrices of the form

![{\displaystyle {\frac {1}{\sqrt {2}}}\left(E_{jk}+E_{kj}\right){\text{ for }}1\leq j<k\leq n\quad \left({\frac {n^{2}-n}{2}}{\text{ matrices}}\right)}](https://wikimedia.org/api/rest_v1/media/math/render/svg/ddeac51c423f6dbefc5f63e483d9aee96e6fa342)

and the matrices

![{\displaystyle {\frac {i}{\sqrt {2}}}\left(E_{jk}-E_{kj}\right){\text{ for }}1\leq j<k\leq n\quad \left({\frac {n^{2}-n}{2}}{\text{ matrices}}\right)}](https://wikimedia.org/api/rest_v1/media/math/render/svg/db65cce3a8fa33e5b7b96badd756c8573aa866c0)

where ![i](https://wikimedia.org/api/rest_v1/media/math/render/svg/add78d8608ad86e54951b8c8bd6c8d8416533d20) denotes the complex number ![{\sqrt {-1}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/4ea1ea9ac61e6e1e84ac39130f78143c18865719), called the _[imaginary unit](http://fakehost/wiki/Imaginary_unit%20%22Imaginary%20unit%22)_.

![{\displaystyle A=\sum _{j}\lambda _{j}u_{j}u_{j}^{\mathsf {H}},}](https://wikimedia.org/api/rest_v1/media/math/render/svg/3b7d749931e5f709bcbc0a446638d3b6b8ed0c6c)

where ![\lambda _{j}](https://wikimedia.org/api/rest_v1/media/math/render/svg/fa91daf9145f27bb95746fd2a37537342d587b77) are the eigenvalues on the diagonal of the diagonal matrix ![\; \Lambda ](https://wikimedia.org/api/rest_v1/media/math/render/svg/1934e7eadd31fbf6f7d6bcf9c0e9bec934ce8976).

*   The determinant of a Hermitian matrix is real:

_Proof:_ ![{\displaystyle \det(A)=\det \left(A^{\mathsf {T}}\right)\quad \Rightarrow \quad \det \left(A^{\mathsf {H}}\right)={\overline {\det(A)}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/a1240df64c3010e0be6eae865fdfcfe6f77bf5eb)

Therefore if ![{\displaystyle A=A^{\mathsf {H}}\quad \Rightarrow \quad \det(A)={\overline {\det(A)}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/43cc392bdcfbb134dd66d9b469847f6370e29d9d).

(Alternatively, the determinant is the product of the matrix's eigenvalues, and as mentioned before, the eigenvalues of a Hermitian matrix are real.)

Decomposition into Hermitian and skew-Hermitian\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=8%20%22Edit%20section:%20Decomposition%20into%20Hermitian%20and%20skew-Hermitian%22)\]
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Additional facts related to Hermitian matrices include:

*   The sum of a square matrix and its conjugate transpose ![{\displaystyle \left(A+A^{\mathsf {H}}\right)}](https://wikimedia.org/api/rest_v1/media/math/render/svg/3ef97bb04ce4ab682bcc84cf1059f8da235b483e) is Hermitian.

*   The difference of a square matrix and its conjugate transpose ![{\displaystyle \left(A-A^{\mathsf {H}}\right)}](https://wikimedia.org/api/rest_v1/media/math/render/svg/f4ac665be4943ce769e33109e9f64abcf1e98050) is [skew-Hermitian](http://fakehost/wiki/Skew-Hermitian_matrix%20%22Skew-Hermitian%20matrix%22) (also called antihermitian). This implies that the [commutator](http://fakehost/wiki/Commutator%20%22Commutator%22) of two Hermitian matrices is skew-Hermitian.

*   An arbitrary square matrix C can be written as the sum of a Hermitian matrix A and a skew-Hermitian matrix B. This is known as the Toeplitz decomposition of C.[\[3\]](#cite_note-HornJohnson-3):p. 7

![{\displaystyle C=A+B\quad {\mbox{with}}\quad A={\frac {1}{2}}\left(C+C^{\mathsf {H}}\right)\quad {\mbox{and}}\quad B={\frac {1}{2}}\left(C-C^{\mathsf {H}}\right)}](https://wikimedia.org/api/rest_v1/media/math/render/svg/0919d2e50fe1008af261f8301f243c002c328dbf)

Rayleigh quotient\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=9%20%22Edit%20section:%20Rayleigh%20quotient%22)\]
------------------------------------------------------------------------------------------------------------------------

In mathematics, for a given complex Hermitian matrix _M_ and nonzero vector _x_, the Rayleigh quotient[\[4\]](#cite_note-4) ![R(M, x)](https://wikimedia.org/api/rest_v1/media/math/render/svg/f8ed067bb4bc06662d6bdf6210d450779a529ce5), is defined as:[\[3\]](#cite_note-HornJohnson-3):p. 234[\[5\]](#cite_note-5)

![{\displaystyle R(M,x):={\frac {x^{\mathsf {H}}Mx}{x^{\mathsf {H}}x}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/6ad9b0047f8437f7b012041d7b2fcd190a5a9ec2).

For real matrices and vectors, the condition of being Hermitian reduces to that of being symmetric, and the conjugate transpose ![{\displaystyle x^{\mathsf {H}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/b431248ab2f121914608bbd1c2376715cecda9c8) to the usual transpose ![{\displaystyle x^{\mathsf {T}}}](https://wikimedia.org/api/rest_v1/media/math/render/svg/d4ee4832d06e8560510d81237d0650c897d476e9). Note that ![{\displaystyle R(M,cx)=R(M,x)}](https://wikimedia.org/api/rest_v1/media/math/render/svg/b1d54d3c850d35f99329591e3b57cef98d17237f) for any non-zero real scalar ![c](https://wikimedia.org/api/rest_v1/media/math/render/svg/86a67b81c2de995bd608d5b2df50cd8cd7d92455). Also, recall that a Hermitian (or real symmetric) matrix has real eigenvalues.

It can be shown\[_[citation needed](http://fakehost/wiki/Wikipedia:Citation_needed%20%22Wikipedia:Citation%20needed%22)_\] that, for a given matrix, the Rayleigh quotient reaches its minimum value ![\lambda_\min](https://wikimedia.org/api/rest_v1/media/math/render/svg/82c24522483ceaf1d54224b69af4244b60c3ac08) (the smallest eigenvalue of M) when ![x](https://wikimedia.org/api/rest_v1/media/math/render/svg/87f9e315fd7e2ba406057a97300593c4802b53e4) is ![v_\min](https://wikimedia.org/api/rest_v1/media/math/render/svg/486623019ef451e0582b874018e0249a46e0f996) (the corresponding eigenvector). Similarly, ![R(M, x) \leq \lambda_\max](https://wikimedia.org/api/rest_v1/media/math/render/svg/18fbf88c578fc9f75d4610ebd18ab55f4f2842ce) and ![R(M, v_\max) = \lambda_\max](https://wikimedia.org/api/rest_v1/media/math/render/svg/200db82bfdbc81cd227cb3470aa826d6f11a7653).

The Rayleigh quotient is used in the min-max theorem to get exact values of all eigenvalues. It is also used in eigenvalue algorithms to obtain an eigenvalue approximation from an eigenvector approximation. Specifically, this is the basis for Rayleigh quotient iteration.

The range of the Rayleigh quotient (for matrix that is not necessarily Hermitian) is called a numerical range (or spectrum in functional analysis). When the matrix is Hermitian, the numerical range is equal to the spectral norm. Still in functional analysis, ![\lambda_\max](https://wikimedia.org/api/rest_v1/media/math/render/svg/957584ae6a35f9edf293cb486d7436fb5b75e803) is known as the spectral radius. In the context of C\*-algebras or algebraic quantum mechanics, the function that to _M_ associates the Rayleigh quotient _R_(_M_, _x_) for a fixed _x_ and _M_ varying through the algebra would be referred to as "vector state" of the algebra.

See also\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=10%20%22Edit%20section:%20See%20also%22)\]
-------------------------------------------------------------------------------------------------------

*   [Vector space](http://fakehost/wiki/Vector_space%20%22Vector%20space%22)
*   [Skew-Hermitian matrix](http://fakehost/wiki/Skew-Hermitian_matrix%20%22Skew-Hermitian%20matrix%22) (anti-Hermitian matrix)
*   [Haynsworth inertia additivity formula](http://fakehost/wiki/Haynsworth_inertia_additivity_formula%20%22Haynsworth%20inertia%20additivity%20formula%22)
*   [Hermitian form](http://fakehost/wiki/Hermitian_form%20%22Hermitian%20form%22)
*   [Self-adjoint operator](http://fakehost/wiki/Self-adjoint_operator%20%22Self-adjoint%20operator%22)
*   [Unitary matrix](http://fakehost/wiki/Unitary_matrix%20%22Unitary%20matrix%22)

References\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=11%20%22Edit%20section:%20References%22)\]
-----------------------------------------------------------------------------------------------------------

1.  **[^](#cite_ref-1)** [Frankel, Theodore](http://fakehost/wiki/Theodore_Frankel%20%22Theodore%20Frankel%22) (2004). [_The Geometry of Physics: an introduction_](https://books.google.com/books?id=DUnjs6nEn8wC&lpg=PA652&dq=%22Lie%20algebra%22%20physics%20%22skew-Hermitian%22&pg=PA652#v=onepage&q&f=false). [Cambridge University Press](http://fakehost/wiki/Cambridge_University_Press%20%22Cambridge%20University%20Press%22). p. 652. [ISBN](http://fakehost/wiki/International_Standard_Book_Number%20%22International%20Standard%20Book%20Number%22) [0-521-53927-7](http://fakehost/wiki/Special:BookSources/0-521-53927-7%20%22Special:BookSources/0-521-53927-7%22).
2.  **[^](#cite_ref-2)** [Physics 125 Course Notes](http://www.hep.caltech.edu/~fcp/physics/quantumMechanics/angularMomentum/angularMomentum.pdf) at [California Institute of Technology](http://fakehost/wiki/California_Institute_of_Technology%20%22California%20Institute%20of%20Technology%22)
3.  ^ [_**a**_](#cite_ref-HornJohnson_3-0) [_**b**_](#cite_ref-HornJohnson_3-1) Horn, Roger A.; Johnson, Charles R. (2013). _Matrix Analysis, second edition_. Cambridge University Press. [ISBN](http://fakehost/wiki/International_Standard_Book_Number%20%22International%20Standard%20Book%20Number%22) [9780521839402](http://fakehost/wiki/Special:BookSources/9780521839402%20%22Special:BookSources/9780521839402%22).
4.  **[^](#cite_ref-4)** Also known as the **Rayleigh–Ritz ratio**; named after [Walther Ritz](http://fakehost/wiki/Walther_Ritz%20%22Walther%20Ritz%22) and [Lord Rayleigh](http://fakehost/wiki/Lord_Rayleigh%20%22Lord%20Rayleigh%22).
5.  **[^](#cite_ref-5)** Parlet B. N. _The symmetric eigenvalue problem_, SIAM, Classics in Applied Mathematics,1998

External links\[[edit](http://fakehost/w/index.php?title=Hermitian_matrix&action=edit&section=12%20%22Edit%20section:%20External%20links%22)\]
-------------------------------------------------------------------------------------------------------------------

*   [Hazewinkel, Michiel](http://fakehost/wiki/Michiel_Hazewinkel%20%22Michiel%20Hazewinkel%22), ed. (2001) \[1994\], ["Hermitian matrix"](https://www.encyclopediaofmath.org/index.php?title=p/h047070), _[Encyclopedia of Mathematics](http://fakehost/wiki/Encyclopedia_of_Mathematics%20%22Encyclopedia%20of%20Mathematics%22)_, Springer Science+Business Media B.V. / Kluwer Academic Publishers, [ISBN](http://fakehost/wiki/International_Standard_Book_Number%20%22International%20Standard%20Book%20Number%22) [978-1-55608-010-4](http://fakehost/wiki/Special:BookSources/978-1-55608-010-4%20%22Special:BookSources/978-1-55608-010-4%22)
*   [Visualizing Hermitian Matrix as An Ellipse with Dr. Geo](https://www.cyut.edu.tw/~ckhung/b/la/hermitian.en.php), by Chao-Kuei Hung from Chaoyang University, gives a more geometric explanation.
*   ["Hermitian Matrices"](http://www.mathpages.com/home/kmath306/kmath306.htm). _MathPages.com_.