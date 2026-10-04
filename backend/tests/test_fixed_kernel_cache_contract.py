import numpy as np
import pytest
from idl_backend.contracts.fixed_kernel import fixed_kernel_request
from idl_backend.datasets.digits import convolve_valid, pool_feature_maps


def test_order_and_duplicates_do_not_create_extra_models():
    assert fixed_kernel_request({"kernels": ["horizontal", "edge", "edge"], "seed": 4}) == {"kernels": ["edge", "horizontal"], "seed": 4}

@pytest.mark.parametrize("seed", [-1, 5, True, 1.5])
def test_only_five_integer_seeds(seed):
    with pytest.raises(ValueError): fixed_kernel_request({"kernels": ["edge"], "seed": seed})

@pytest.mark.parametrize("kernels", [[], ["bad"], "edge"])
def test_reject_invalid_combinations(kernels):
    with pytest.raises(ValueError): fixed_kernel_request({"kernels": kernels, "seed": 0})

def test_response_is_26_before_regional_average_to_8():
    image = np.arange(784,dtype=np.float32).reshape(1,28,28)
    kernel = np.zeros((3,3),dtype=np.float32); kernel[1,1]=1
    response = convolve_valid(image,kernel)
    assert response.shape == (1,26,26)
    np.testing.assert_array_equal(response,image[:,1:-1,1:-1])
    pooled = pool_feature_maps(response)
    assert pooled.shape == (1,8,8)
    assert pooled[0,0,0] == response[0,:3,:3].mean()
    assert pooled[0,-1,-1] == response[0,22:26,22:26].mean()
